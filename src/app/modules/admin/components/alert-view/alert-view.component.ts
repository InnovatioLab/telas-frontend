import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseModule } from '@app/shared/base/base.module';
import { Authentication } from '@app/core/service/auth/autenthication';
import { MapsComponent } from '@app/shared/components/maps/maps.component';
import { SidebarMapaComponent } from '@app/shared/components/sidebar-mapa/sidebar-mapa.component';
import { GoogleMapsService } from '@app/core/service/api/google-maps.service';
import { ToastService } from '@app/core/service/state/toast.service';
import { MapPoint } from '@app/core/service/state/map-point.interface';
import { PopUpStepAddListComponent } from '@app/shared/components/pop-up-add-list/pop-up-add-list.component';
import { AlertAdminSidebarComponent } from '@app/shared/components/alert-admin-sidebar/alert-admin-sidebar.component';
import { MonitorService } from '@app/core/service/api/monitor.service';
import { LoadingService } from '@app/core/service/state/loading.service';

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
    AlertAdminSidebarComponent
  ]
})
export class AlertViewComponent implements OnInit, OnDestroy {
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
  
  ngOnDestroy(): void {
    window.removeEventListener('toggle-admin-sidebar', this.adminSidebarListener as EventListener);
  }
  
  onAdminSidebarVisibilityChange(isVisible: boolean): void {
    this.updateHeaderSidebarStatus(isVisible);
  }
  
  private updateHeaderSidebarStatus(isVisible: boolean): void {
    const header = document.querySelector('app-header') as any;
    header?.updateAdminSidebarVisibility?.(isVisible);
  }
  
  private loadMonitorData(): void {
    this.loadingService.setLoading(true, 'load-monitors');
    this.monitorService.getMonitors().subscribe(
      (monitors) => {
        this.mapPoints = monitors.map(monitor => ({
          id: monitor.id,
          title: monitor.name,
          position: {
            lat: parseFloat((Math.random() * (41.9 - 41.7) + 41.7).toFixed(6)),
            lng: parseFloat((Math.random() * (-87.6 - -87.8) + -87.8).toFixed(6))
          },
          type: 'monitor',
          description: monitor.locationDescription || 'Monitor location',
          icon: this.getIconForStatus(monitor.status),
          data: monitor
        }));
        
        this.emitMonitorsFoundEvent(this.mapPoints);
        this.loadingService.setLoading(false, 'load-monitors');
      },
      (error) => {
        this.toastService.erro('Erro ao carregar monitores');
        this.loadingService.setLoading(false, 'load-monitors');
      }
    );
  }
  
  private getIconForStatus(status: string): string {
    switch(status) {
      case 'INACTIVE': return 'assets/icons/marker-inactive.png';
      case 'SUSPENDED': return 'assets/icons/marker-warning.png';
      default: return 'assets/icons/marker-active.png';
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
}

interface ToggleAdminSidebarEvent {
  visible: boolean;
}
