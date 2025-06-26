import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GoogleMapsService } from '@app/core/service/api/google-maps.service';
import { MapPoint } from '@app/core/service/state/map-point.interface';
import { ToastService } from '@app/core/service/state/toast.service';
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
    MapsComponent,
    SidebarMapaComponent,
    RodapeComponent,
    PopUpStepAddListComponent
  ],
  templateUrl: './client-view.component.html',
  styleUrls: ['./client-view.component.scss']
})
export class ClientViewComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MapsComponent) mapsComponent!: MapsComponent;
  
  showPointMenu = false;
  menuPosition = { x: 0, y: 0 };
  selectedPoint: MapPoint | null = null;
  savedPoints: MapPoint[] = [];
  isLoading = false;
  
  constructor(
    public readonly mapsService: GoogleMapsService,
    private readonly toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    
    // Aguardar um pouco para garantir que o componente está pronto
    setTimeout(() => {
      this.ensureMapInitialized();
    }, 500);
  }
  
  ngAfterViewInit(): void {
    // Verificar se o mapa precisa ser inicializado
    setTimeout(() => {
      this.ensureMapInitialized();
    }, 1000);
  }
  
  ngOnDestroy(): void {
    // Cleanup se necessário
  }
  
  private ensureMapInitialized(): void {
    if (this.mapsComponent) {
      this.mapsComponent.ensureMapInitialized();
      
      // Verificar se o mapa está pronto
      setTimeout(() => {
        if (!this.mapsComponent.isMapReady()) {
          console.log('Map not ready, forcing reinitialization...');
          this.mapsComponent.forceReinitialize();
        } else {
          this.isLoading = false;
        }
      }, 2000);
    } else {
      console.warn('Maps component not available');
      this.isLoading = false;
    }
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
