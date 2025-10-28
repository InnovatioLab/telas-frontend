import { CommonModule } from "@angular/common";
import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
} from "@angular/core";
import { GoogleMapsService } from "@app/core/service/api/google-maps.service";
import { MonitorService } from "@app/core/service/api/monitor.service";
import { Authentication } from "@app/core/service/auth/autenthication";
import { LoadingService } from "@app/core/service/state/loading.service";
import { MapPoint } from "@app/core/service/state/map-point.interface";
import { ToastService } from "@app/core/service/state/toast.service";
import { BaseModule } from "@app/shared/base/base.module";
import { MapsComponent } from "@app/shared/components/maps/maps.component";
import { PopUpStepAddListComponent } from "@app/shared/components/pop-up-add-list/pop-up-add-list.component";
import { SidebarMapaComponent } from "@app/shared/components/sidebar-mapa/sidebar-mapa.component";

@Component({
  selector: "app-alert-view",
  templateUrl: "./alert-view.component.html",
  styleUrls: ["./alert-view.component.scss"],
  standalone: true,
  imports: [
    CommonModule,
    BaseModule,
    MapsComponent,
    SidebarMapaComponent,
    PopUpStepAddListComponent,
  ],
})
export class AlertViewComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(MapsComponent) mapsComponent!: MapsComponent;

  userName: string = "";
  showPointMenu = false;
  menuPosition = { x: 0, y: 0 };
  selectedPoint: MapPoint | null = null;
  savedPoints: MapPoint[] = [];
  mapPoints: MapPoint[] = [];
  private readonly adminSidebarListener: (
    e: CustomEvent<ToggleAdminSidebarEvent>
  ) => void;

  constructor(
    private readonly authentication: Authentication,
    private readonly mapsService: GoogleMapsService,
    private readonly toastService: ToastService,
    private readonly monitorService: MonitorService,
    private readonly loadingService: LoadingService
  ) {
    this.adminSidebarListener = (e: CustomEvent<ToggleAdminSidebarEvent>) => {
      this.updateHeaderSidebarStatus(e.detail.visible);
    };
  }

  ngOnInit(): void {
    const client = this.authentication._clientSignal();
    if (client) {
      this.userName = client.businessName;
    }

    // this.loadMonitorData();
    window.addEventListener(
      "toggle-admin-sidebar",
      this.adminSidebarListener as EventListener
    );
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.ensureMapInitialized();
    }, 1000);
  }

  ngOnDestroy(): void {
    window.removeEventListener(
      "toggle-admin-sidebar",
      this.adminSidebarListener as EventListener
    );
  }

  private ensureMapInitialized(): void {
    if (this.mapsComponent) {
      this.mapsComponent.ensureMapInitialized();

      setTimeout(() => {
        if (!this.mapsComponent.isMapReady()) {
          this.mapsComponent.forceReinitialize();
        }
      }, 2000);
    }
  }

  private updateHeaderSidebarStatus(isVisible: boolean): void {
    const header = document.querySelector("app-header");
    (header as any)?.updateAdminSidebarVisibility?.(isVisible);
  }

  // private loadMonitorData(): void {
  //   this.loadingService.setLoading(true, 'load-monitors');
  //   this.monitorService.getMonitors()
  //     .pipe(
  //       finalize(() => this.loadingService.setLoading(false, 'load-monitors'))
  //     )
  //     .subscribe({
  //       next: (monitors) => {
  //         this.mapPoints = monitors.map(monitor => {
  //           let lat: number;
  //           let lng: number;

  //           if (monitor.latitude && monitor.longitude) {
  //             lat = typeof monitor.latitude === 'string' ? parseFloat(monitor.latitude) : monitor.latitude;
  //             lng = typeof monitor.longitude === 'string' ? parseFloat(monitor.longitude) : monitor.longitude;
  //           } else if (monitor.address?.latitude && monitor.address?.longitude) {
  //             lat = typeof monitor.address.latitude === 'string' ? parseFloat(monitor.address.latitude) : monitor.address.latitude;
  //             lng = typeof monitor.address.longitude === 'string' ? parseFloat(monitor.address.longitude) : monitor.address.longitude;
  //           } else {
  //             console.warn(`Monitor ${monitor.name || monitor.id} não possui coordenadas válidas`);
  //             lng = -38.5270;
  //           }

  //           const hasAvailableSlots = monitor.hasAvailableSlots;

  //           return {
  //             id: monitor.id,
  //             title: monitor.name || 'Monitor',
  //             position: {
  //               lat,
  //               lng
  //             },
  //             latitude: lat,
  //             longitude: lng,
  //             category: 'MONITOR',
  //             description: monitor.locationDescription || monitor.address?.coordinatesParams || 'Monitor location',
  //             hasAvailableSlots: hasAvailableSlots,
  //             icon: this.getIconForStatus(monitor.status),
  //             data: monitor
  //           };
  //         });

  //         this.emitMonitorsFoundEvent(this.mapPoints);
  //       },

  //     });
  // }

  private getIconForStatus(status: string): string {
    switch (status) {
      case "active":
        return "pi pi-check-circle";
      case "inactive":
        return "pi pi-times-circle";
      default:
        return "pi pi-circle";
    }
  }

  private emitMonitorsFoundEvent(monitors: MapPoint[]): void {
    const event = new CustomEvent("monitors-found", {
      detail: { monitors },
    });
    window.dispatchEvent(event);
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

  showPointDetails(point: MapPoint): void {
    this.mapsService.selectPoint(point);
  }

  // Removido o método addPointToList pois agora o fluxo é gerenciado pelo cartService
  // através dos componentes sidebar-mapa e pop-up-add-list

  private checkMapInitialization(): void {
    if (!this.mapsComponent?.isMapReady()) {
      this.mapsComponent?.forceReinitialize();
    }
  }
}

interface ToggleAdminSidebarEvent {
  visible: boolean;
}
