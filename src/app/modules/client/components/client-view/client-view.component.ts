import { CommonModule } from "@angular/common";
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  Inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from "@angular/core";
import { RouterModule } from "@angular/router";
import { GoogleMapsService } from "@app/core/service/api/google-maps.service";
import { MapPoint } from "@app/core/service/state/map-point.interface";
import { ToastService } from "@app/core/service/state/toast.service";
import { MapsComponent } from "@app/shared/components/maps/maps.component";
import { PopUpStepAddListComponent } from "@app/shared/components/pop-up-add-list/pop-up-add-list.component";
import { SearchSectionComponent } from "@app/shared/components/search-section/search-section.component";
import { SidebarMapaComponent } from "@app/shared/components/sidebar-mapa/sidebar-mapa.component";
import {
  MonitorResultListItem,
  MonitorResultsListComponent,
} from "@app/shared/components/monitor-results-list/monitor-results-list.component";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import * as L from "leaflet";
import { MapViewportFacadeService } from "../../services/map-viewport-facade.service";
import { ClientViewService } from "../../services/client-view.service";
import { ENVIRONMENT } from "src/environments/environment-token";
import { Environment } from "src/environments/environment.interface";

@Component({
  selector: "feat-client-view",
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    PrimengModule,
    SearchSectionComponent,
    MapsComponent,
    SidebarMapaComponent,
    PopUpStepAddListComponent,
    MonitorResultsListComponent,
  ],
  providers: [MapViewportFacadeService],
  templateUrl: "./client-view.component.html",
  styleUrls: ["./client-view.component.scss"],
})
export class ClientViewComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MapsComponent) mapsComponent!: MapsComponent;

  showPointMenu = false;
  menuPosition = { x: 0, y: 0 };
  selectedPoint: MapPoint | null = null;

  zipSearchResults: MonitorResultListItem[] = [];
  lastZipCode: string | null = null;

  private readonly onWindowMonitorsFound = (e: Event): void => {
    const customEvent = e as CustomEvent;
    if (customEvent.detail?.monitors) {
      const monitors: MapPoint[] = customEvent.detail.monitors;
      this.viewportFacade.onZipSearchWithResults(monitors, true);
    }
  };

  constructor(
    @Inject(ENVIRONMENT) public readonly env: Environment,
    public readonly mapsService: GoogleMapsService,
    private readonly toastService: ToastService,
    private readonly cdr: ChangeDetectorRef,
    public readonly clientViewService: ClientViewService,
    private readonly viewportFacade: MapViewportFacadeService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.clientViewService.initializeMap();

    window.addEventListener("monitors-found", this.onWindowMonitorsFound);
  }

  ngAfterViewInit(): void {
    this.viewportFacade.connect({
      getMapsComponent: () => this.mapsComponent,
      googleMapsService: this.mapsService,
      ensureMapInitialized: () => this.mapsComponent?.ensureMapInitialized(),
    });
  }

  ngOnDestroy(): void {
    window.removeEventListener("monitors-found", this.onWindowMonitorsFound);
  }

  onMapLeafletInitialized(leafletMap: L.Map): void {
    this.viewportFacade.onMapLeafletInitialized(leafletMap);
  }

  onMapReady(leafletMap: L.Map): void {
    this.viewportFacade.onMapReady(leafletMap);
  }

  onMapError(errorMessage: string): void {
    this.toastService.erro(errorMessage);
    this.cdr.detectChanges();
  }

  handlePointClick(data: { point: MapPoint; event: MouseEvent }): void {
    const { point, event } = data;
    this.selectedPoint = point;

    this.menuPosition = {
      x: event.clientX,
      y: event.clientY,
    };

    this.showPointMenu = true;

    event.stopPropagation();
  }

  handleMarkerClick(point: MapPoint): void {
    this.mapsService.selectPoint(point);
  }

  showPointDetails(point: MapPoint): void {
    this.mapsService.selectPoint(point);
  }

  addPointToList(point: MapPoint): void {
    this.mapsService.addToSavedPoints(point);
  }

  onMonitorsFound(monitors: MapPoint[], zipCode?: string): void {
    if (monitors && monitors.length > 0) {
      this.zipSearchResults = (monitors as MonitorResultListItem[]).filter(
        (m): m is MonitorResultListItem =>
          typeof m.id === "string" &&
          typeof m.latitude === "number" &&
          typeof m.longitude === "number"
      );
      this.lastZipCode = zipCode ?? null;
      this.viewportFacade.onZipSearchWithResults(monitors, true);
    } else if (zipCode) {
      this.zipSearchResults = [];
      this.lastZipCode = zipCode;
      this.viewportFacade.onZipSearchEmpty();
      this.clientViewService.focusOnZipCodeLocation(zipCode).then(() => {
        const center = this.clientViewService.mapCenter();
        if (center) {
          this.mapsComponent?.setMapCenter(center);
        }
        this.viewportFacade.triggerViewportFromMap();
      });
    } else {
      this.zipSearchResults = [];
      this.lastZipCode = null;
    }
  }

  onSelectSearchResult(item: MonitorResultListItem): void {
    this.mapsService.selectPoint(item);
    this.mapsComponent?.setMapCenter({ lat: item.latitude, lng: item.longitude });
  }
}
