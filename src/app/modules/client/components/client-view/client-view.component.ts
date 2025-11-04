import { CommonModule } from "@angular/common";
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
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
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { ClientViewService } from "../../services/client-view.service";

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
  ],
  templateUrl: "./client-view.component.html",
  styleUrls: ["./client-view.component.scss"],
})
export class ClientViewComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MapsComponent) mapsComponent!: MapsComponent;

  showPointMenu = false;
  menuPosition = { x: 0, y: 0 };
  selectedPoint: MapPoint | null = null;

  constructor(
    public readonly mapsService: GoogleMapsService,
    private readonly toastService: ToastService,
    private readonly cdr: ChangeDetectorRef,
    public readonly clientViewService: ClientViewService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.clientViewService.initializeMap();

    window.addEventListener("monitors-found", ((e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.monitors) {
        const monitors: MapPoint[] = customEvent.detail.monitors;
        this.mapsComponent.setMapPoints(monitors);
      }
    }) as EventListener);
  }

  ngAfterViewInit(): void {
    if (this.mapsComponent) {
      this.mapsComponent.ensureMapInitialized();
    }
  }

  ngOnDestroy(): void {}

  onMapInitialized(): void {
    this.cdr.detectChanges();
  }

  onMapReady(): void {
    this.cdr.detectChanges();
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
      this.mapsComponent?.setMapPoints(monitors);
      this.mapsComponent?.fitBoundsToPoints(monitors);
      this.mapsService.updateNearestMonitors(monitors);
    } else if (zipCode) {
      this.clientViewService.focusOnZipCodeLocation(zipCode).then(() => {
        const center = this.clientViewService.mapCenter();
        if (center) {
          this.mapsComponent?.setMapCenter(center);
        }
      });
    }
  }
}
