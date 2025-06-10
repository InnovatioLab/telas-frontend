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

@Component({
  selector: 'app-admin-view',
  templateUrl: './admin-view.component.html',
  styleUrls: ['./admin-view.component.scss'],
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
export class AdminViewComponent implements OnInit, OnDestroy {
  userName: string = '';
  showPointMenu = false;
  menuPosition = { x: 0, y: 0 };
  selectedPoint: MapPoint | null = null;
  savedPoints: MapPoint[] = [];
  isLoading = false;
  private readonly adminSidebarListener: (e: CustomEvent<ToggleAdminSidebarEvent>) => void;
  
  constructor(
    private readonly authentication: Authentication,
    private readonly mapsService: GoogleMapsService,
    private readonly toastService: ToastService
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

    setTimeout(() => {
      this.loadNearbyPoints();
    }, 1500);

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
  
  private loadNearbyPoints(): void {
    this.isLoading = true;
    this.mapsService.getCurrentLocation()
      .then((location: {latitude: number, longitude: number} | null) => {
        if (location) {
          this.findNearbyPoints(location.latitude, location.longitude);
        } else {
          this.toastService.aviso('Could not determine your location. Please search for an address.');
          this.isLoading = false;
        }
      })
      .catch((error: Error) => {
        this.toastService.erro('Error accessing your location. Please allow location access.');
        this.isLoading = false;
      });
  }
  
  private findNearbyPoints(latitude: number, longitude: number): void {
    this.mapsService.findNearbyMonitors(latitude, longitude)
      .then((monitors: MapPoint[]) => {
        if (monitors && monitors.length > 0) {
          this.emitMonitorsFoundEvent(monitors);
        }
        this.isLoading = false;
      })
      .catch((error: Error) => {
        this.toastService.erro('Error searching for nearby monitors');
        this.isLoading = false;
      });
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
