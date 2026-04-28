import { CommonModule } from "@angular/common";
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  computed,
  Inject,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
} from "@angular/core";
import { RouterModule } from "@angular/router";
import { GoogleMapsService } from "@app/core/service/api/google-maps.service";
import { MapPoint } from "@app/core/service/state/map-point.interface";
import { LayoutService } from "@app/core/service/state/layout.service";
import { ToastService } from "@app/core/service/state/toast.service";
import { MapsComponent } from "@app/shared/components/maps/maps.component";
import { PopUpStepAddListComponent } from "@app/shared/components/pop-up-add-list/pop-up-add-list.component";
import { SearchSectionComponent } from "@app/shared/components/search-section/search-section.component";
import { Authentication } from "@app/core/service/auth/autenthication";
import {
  isClientShoppingRole,
  isPrivilegedPanelRole,
} from "@app/model/client";
import {
  MonitorResultListItem,
  MonitorResultsListComponent,
} from "@app/shared/components/monitor-results-list/monitor-results-list.component";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import * as L from "leaflet";
import { Subscription } from "rxjs";
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
  selectedMonitorId: string | null = null;
  locationsPanelOpen = false;

  private readonly authentication = inject(Authentication);
  private readonly layoutService = inject(LayoutService);
  private selectedPointSubscription?: Subscription;

  readonly locationsPanelInsetLeft = computed(() => {
    if (
      this.layoutService.isMobile() ||
      this.layoutService.isMobileCompact()
    ) {
      return 0;
    }
    return this.layoutService.currentSidebarWidth();
  });

  private readonly onWindowMonitorsFound = (e: Event): void => {
    const customEvent = e as CustomEvent;
    if (customEvent.detail?.monitors) {
      const monitors: MapPoint[] = customEvent.detail.monitors;
      this.viewportFacade.onZipSearchWithResults(monitors, true);
      this.applyZipSearchResultsFromMonitors(monitors);
    }
  };

  private applyZipSearchResultsFromMonitors(monitors: MapPoint[]): void {
    this.zipSearchResults = (monitors as MonitorResultListItem[]).filter(
      (m): m is MonitorResultListItem =>
        typeof m.id === "string" &&
        typeof m.latitude === "number" &&
        typeof m.longitude === "number"
    );
    this.locationsPanelOpen = this.zipSearchResults.length > 0;
    this.cdr.markForCheck();
    if (this.locationsPanelOpen) {
      this.scheduleMapInvalidate();
    }
  }

  constructor(
    @Inject(ENVIRONMENT) public readonly env: Environment,
    public readonly mapsService: GoogleMapsService,
    private readonly toastService: ToastService,
    private readonly cdr: ChangeDetectorRef,
    public readonly clientViewService: ClientViewService,
    private readonly viewportFacade: MapViewportFacadeService
  ) {}

  get showShoppingActions(): boolean {
    return isClientShoppingRole(this.authentication.client()?.role);
  }

  get showPopupCartButton(): boolean {
    const role = this.authentication.client()?.role;
    if (isPrivilegedPanelRole(role)) {
      return false;
    }
    if (isClientShoppingRole(role)) {
      return false;
    }
    return true;
  }

  async ngOnInit(): Promise<void> {
    await this.clientViewService.initializeMap();

    window.addEventListener("monitors-found", this.onWindowMonitorsFound);

    this.selectedPointSubscription = this.mapsService.selectedPoint$.subscribe(
      (point) => {
        this.selectedMonitorId = point?.id ?? null;
        this.cdr.markForCheck();
      }
    );
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
    this.selectedPointSubscription?.unsubscribe();
  }

  onHoverMonitorIdChange(monitorId: string | null): void {
    this.mapsComponent?.setHoveredMonitor(monitorId);
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
      this.lastZipCode = zipCode ?? null;
      this.applyZipSearchResultsFromMonitors(monitors);
      this.viewportFacade.onZipSearchWithResults(monitors, true);
    } else if (zipCode) {
      this.zipSearchResults = [];
      this.lastZipCode = zipCode;
      this.locationsPanelOpen = false;
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
      this.locationsPanelOpen = false;
    }
  }

  onSelectSearchResult(item: MonitorResultListItem): void {
    this.mapsService.selectPoint(item);
    this.mapsComponent?.setMapCenter({ lat: item.latitude, lng: item.longitude });
  }

  closeLocationsPanel(): void {
    this.locationsPanelOpen = false;
    this.scheduleMapInvalidate();
  }

  openLocationsPanel(): void {
    if (this.zipSearchResults.length === 0) {
      return;
    }
    this.locationsPanelOpen = true;
    this.scheduleMapInvalidate();
  }

  private scheduleMapInvalidate(): void {
    this.cdr.markForCheck();
    queueMicrotask(() => {
      const map = this.mapsComponent?.getLeafletMap();
      map?.invalidateSize();
      setTimeout(() => map?.invalidateSize(), 320);
    });
  }
}
