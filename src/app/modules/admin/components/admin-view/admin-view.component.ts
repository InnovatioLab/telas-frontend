import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GoogleMapsService } from '../../../../core/service/api/google-maps.service';
import { MapPoint } from '../../../../core/service/state/map-point.interface';
import { LoadingService } from '../../../../core/service/state/loading.service';
import { Subscription } from 'rxjs';
import { MapsComponent } from '../../../../shared/components/maps/maps.component';
import { SidebarMapaComponent } from '../../../../shared/components/sidebar-mapa/sidebar-mapa.component';

@Component({
  selector: 'app-admin-view',
  standalone: true,
  imports: [CommonModule, FormsModule, MapsComponent, SidebarMapaComponent],
  template: `
    <app-sidebar-mapa></app-sidebar-mapa>
    
    <div class="admin-view">
      <div class="map-container">
        <app-maps
          #mapsComponent
          [points]="monitors"
          [center]="mapCenter"
          height="100vh"
          width="100%"
          (markerClicked)="onMarkerClick($event)"
          (mapInitialized)="onMapInitialized($event)">
        </app-maps>
      </div>
      
      <div class="monitors-list" *ngIf="monitors.length > 0">
        <h3>Monitores Encontrados</h3>
        <ul>
          <li *ngFor="let monitor of monitors" (click)="onMonitorClick(monitor)">
            <div class="monitor-info">
              <span class="monitor-title">{{ monitor.title }}</span>
              <span class="monitor-type">{{ monitor.data?.type }}</span>
            </div>
          </li>
        </ul>
      </div>
    </div>
  `,
  styles: [`
    .admin-view {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      height: 100%;
    }
    
    .map-container {
      flex: 1;
      min-height: 500px;
    }
    
    .monitors-list {
      width: 300px;
      background: white;
      border-radius: 8px;
      padding: 1rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      
      h3 {
        margin: 0 0 1rem;
        color: #333;
      }
      
      ul {
        list-style: none;
        padding: 0;
        margin: 0;
        
        li {
          padding: 0.75rem;
          border-bottom: 1px solid #eee;
          cursor: pointer;
          transition: background-color 0.2s;
          
          &:hover {
            background-color: #f5f5f5;
          }
          
          &:last-child {
            border-bottom: none;
          }
        }
      }
      
      .monitor-info {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        
        .monitor-title {
          font-weight: 500;
          color: #333;
        }
        
        .monitor-type {
          font-size: 0.875rem;
          color: #666;
        }
      }
    }
  `]
})
export class AdminViewComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('mapsComponent') mapsComponent!: MapsComponent;
  
  monitors: MapPoint[] = [];
  mapCenter: { lat: number; lng: number } | null = null;
  private map: google.maps.Map | null = null;
  private readonly subscriptions: Subscription[] = [];

  constructor(
    private readonly googleMapsService: GoogleMapsService,
    private readonly loadingService: LoadingService
  ) {}

  ngOnInit(): void {
    this.loadNearbyPoints();
    this.setupEventListeners();
  }
  
  ngAfterViewInit(): void {
    setTimeout(() => {
      this.ensureMapInitialized();
    }, 1000);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
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

  private setupEventListeners(): void {
    const userCoordsSub = this.googleMapsService.savedPoints$.subscribe(points => {
      if (points.length > 0) {
        const lastPoint = points[points.length - 1];
        this.mapCenter = {
          lat: lastPoint.latitude,
          lng: lastPoint.longitude
        };
        this.loadNearbyPoints();
      }
    });

    this.subscriptions.push(userCoordsSub);
  }

  private loadNearbyPoints(): void {
    if (!this.mapCenter) return;

    this.loadingService.setLoading(true, 'load-nearby-points');
    
    this.googleMapsService.findNearbyMonitors(
      this.mapCenter.lat,
      this.mapCenter.lng
    ).then(monitors => {
      this.monitors = monitors;
      this.loadingService.setLoading(false, 'load-nearby-points');
    }).catch(error => {
      this.loadingService.setLoading(false, 'load-nearby-points');
    });
  }

  onMapInitialized(map: google.maps.Map): void {
    this.map = map;
  }

  onMarkerClick(point: MapPoint): void {
    this.googleMapsService.selectPoint(point);
    
    if (this.map) {
      this.map.setCenter({
        lat: point.latitude,
        lng: point.longitude
      });
      this.map.setZoom(16);
    }
  }

  onMonitorClick(monitor: MapPoint): void {
    this.onMarkerClick(monitor);
  }

  private checkMapInitialization(): void {
    if (!this.mapsComponent?.isMapReady()) {
      this.mapsComponent?.forceReinitialize();
    }
  }
}

