import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseModule } from '@app/shared/base/base.module';
import { Authentication } from '@app/core/service/auth/autenthication';
import { MapsComponent } from '@app/shared/components/maps/maps.component';
import { SidebarMapaComponent } from '@app/shared/components/sidebar-mapa/sidebar-mapa.component';
import { GoogleMapsService } from '@app/core/service/api/google-maps.service';
import { ToastService } from '@app/core/service/state/toast.service';
import { MapPoint } from '@app/core/service/state/map-point.interface';
import { PopUpStepAddListComponent } from '@app/shared/components/pop-up-add-list/pop-up-add-list.component';
import { MonitorService } from '@app/core/service/api/monitor.service';
import { LoadingService } from '@app/core/service/state/loading.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-alert-view',
  templateUrl: './alert-view.component.html',
  styleUrls: ['./alert-view.component.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    BaseModule, 
    MapsComponent, 
    SidebarMapaComponent,
    PopUpStepAddListComponent,
  ]
})
export class AlertViewComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(MapsComponent) mapsComponent!: MapsComponent;
  
  userName: string = '';
  showPointMenu = false;
  menuPosition = { x: 0, y: 0 };
  selectedPoint: MapPoint | null = null;
  savedPoints: MapPoint[] = [];
  mapPoints: MapPoint[] = [];
  private readonly adminSidebarListener: (e: CustomEvent<ToggleAdminSidebarEvent>) => void;
  
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

    this.loadMonitorData();
    window.addEventListener('toggle-admin-sidebar', this.adminSidebarListener as EventListener);
  }
  
  ngAfterViewInit(): void {
    setTimeout(() => {
      this.ensureMapInitialized();
    }, 1000);
  }
  
  ngOnDestroy(): void {
    window.removeEventListener('toggle-admin-sidebar', this.adminSidebarListener as EventListener);
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
    const header = document.querySelector('app-header') as any;
    header?.updateAdminSidebarVisibility?.(isVisible);
  }
  
  private loadMonitorData(): void {
    this.loadingService.setLoading(true, 'load-monitors');
    this.monitorService.getMonitors()
      .pipe(
        finalize(() => this.loadingService.setLoading(false, 'load-monitors'))
      )
      .subscribe({
        next: (monitors) => {
          this.mapPoints = monitors.map(monitor => {
            const lat = parseFloat((Math.random() * (41.9 - 41.7) + 41.7).toFixed(6));
            const lng = parseFloat((Math.random() * (-87.6 - -87.8) + -87.8).toFixed(6));
            return {
              id: monitor.id,
              title: monitor.name,
              position: {
                lat,
                lng
              },
              latitude: lat,
              longitude: lng,
              type: 'monitor',
              description: monitor.locationDescription || 'Monitor location',
              icon: this.getIconForStatus(monitor.status),
              data: monitor
            };
          });
          
          this.emitMonitorsFoundEvent(this.mapPoints);
        },
        error: (error) => {
          this.toastService.erro('Erro ao carregar monitores');
        }
      });
  }
  
  private getIconForStatus(status: string): string {
    switch (status) {
      case 'active':
        return 'pi pi-check-circle';
      case 'inactive':
        return 'pi pi-times-circle';
      default:
        return 'pi pi-circle';
    }
  }
  
  private emitMonitorsFoundEvent(monitors: MapPoint[]): void {
    const event = new CustomEvent('monitors-found', {
      detail: { monitors }
    });
    window.dispatchEvent(event);
  }
  
  handlePointClick(data: {point: MapPoint, event: MouseEvent}): void {
    const { point, event } = data;
    this.selectedPoint = point;
    
    this.menuPosition = { 
      x: event.clientX, 
      y: event.clientY 
    };
    
    this.showPointMenu = true;
    
    event.stopPropagation();
  }
  
  showPointDetails(point: MapPoint): void {
    this.mapsService.selectPoint(point);
  }
  
  addPointToList(point: MapPoint): void {
    this.mapsService.addToSavedPoints(point);
  }

  private checkMapInitialization(): void {
    if (!this.mapsComponent || !this.mapsComponent.isMapReady()) {
      this.mapsComponent?.forceMapReinitialization();
    }
  }
}

interface ToggleAdminSidebarEvent {
  visible: boolean;
}

}
