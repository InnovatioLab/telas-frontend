import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GoogleMapsService } from '@app/core/service/google-maps/google-maps.service';
import { MapPoint } from '@app/core/service/google-maps/map-point.interface';
import { ToastService } from '@app/core/service/toast.service';
import { ClientMenuSideComponent } from '@app/shared/components/client-menu-side/client-menu-side.component';
import { HeaderComponent } from '@app/shared/components/header/header.component';
import { MapsComponent } from '@app/shared/components/maps/maps.component';
import { PopUpStepAddListComponent } from '@app/shared/components/pop-up-add-list/pop-up-add-list.component';
import { RodapeComponent } from '@app/shared/components/rodape/rodape.component';
import { SidebarMapaComponent } from '@app/shared/components/sidebar-mapa/sidebar-mapa.component';
import { PrimengModule } from '@app/shared/primeng/primeng.module';

@Component({
  selector: 'feat-client-view',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    PrimengModule,
    HeaderComponent,
    MapsComponent,
    SidebarMapaComponent,
    ClientMenuSideComponent,
    RodapeComponent,
    PopUpStepAddListComponent
  ],
  templateUrl: './client-view.component.html',
  styleUrls: ['./client-view.component.scss']
})
export class ClientViewComponent implements OnInit {
  showPointMenu = false;
  menuPosition = { x: 0, y: 0 };
  selectedPoint: MapPoint | null = null;
  savedPoints: MapPoint[] = [];
  
  constructor(
    private readonly mapsService: GoogleMapsService,
    private readonly toastService: ToastService
  ) {}
  
  ngOnInit(): void {
    setTimeout(() => {
      this.loadNearbyPoints();
    }, 1500);
  }
  
  private loadNearbyPoints(): void {
    this.mapsService.getCurrentLocation()
      .then((location: {latitude: number, longitude: number} | null) => {
        if (location) {
          this.findNearbyPoints(location.latitude, location.longitude);
        } else {
          this.toastService.aviso('Could not determine your location. Please search for an address.');
        }
      })
      .catch((error: Error) => {
        console.error('Error getting user location:', error);
        this.toastService.erro('Error accessing your location. Please allow location access.');
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
      })
      .catch((error: Error) => {
        console.error('Error finding nearby monitors:', error);
        this.toastService.erro('Error searching for nearby monitors');
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
