import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseModule } from '@app/shared/base/base.module';
import { Authentication } from '@app/core/service/auth/autenthication';
import { MapsComponent } from '@app/shared/components/maps/maps.component';
import { SidebarMapaComponent } from '@app/shared/components/sidebar-mapa/sidebar-mapa.component';
import { RodapeComponent } from '@app/shared/components/rodape/rodape.component';
import { GoogleMapsService } from '@app/core/service/api/google-maps.service';
import { ToastService } from '@app/core/service/state/toast.service';
import { MapPoint } from '@app/core/service/state/map-point.interface';
import { PopUpStepAddListComponent } from '@app/shared/components/pop-up-add-list/pop-up-add-list.component';
import { HeaderComponent } from '@app/shared/components/header/header.component';

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
    RodapeComponent,
    PopUpStepAddListComponent,
    HeaderComponent
  ]
})
export class AdminViewComponent implements OnInit {
  userName: string = '';
  showPointMenu = false;
  menuPosition = { x: 0, y: 0 };
  selectedPoint: MapPoint | null = null;
  savedPoints: MapPoint[] = [];
  isLoading = false;

  constructor(
    private readonly authentication: Authentication,
    private readonly mapsService: GoogleMapsService,
    private readonly toastService: ToastService
  ) {
    console.log('AdminViewComponent: Construído');
  }

  ngOnInit(): void {
    console.log('AdminViewComponent: Inicializado');
    const client = this.authentication._clientSignal();
    console.log('AdminViewComponent: Cliente:', client);
    if (client) {
      this.userName = client.businessName || 'Administrador';
    }

    setTimeout(() => {
      this.loadNearbyPoints();
    }, 1500);
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
        console.error('Error getting user location:', error);
        this.toastService.erro('Error accessing your location. Please allow location access.');
        this.isLoading = false;
      });
  }
  
  private findNearbyPoints(latitude: number, longitude: number): void {
    this.mapsService.findNearbyMonitors(latitude, longitude)
      .then((monitors: MapPoint[]) => {
        if (monitors && monitors.length > 0) {
          this.emitMonitorsFoundEvent(monitors);
        } else {
          console.log('No monitors found near initial location');
        }
        this.isLoading = false;
      })
      .catch((error: Error) => {
        console.error('Error finding nearby monitors:', error);
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
