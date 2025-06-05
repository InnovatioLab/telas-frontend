import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, OnDestroy, NgZone, ElementRef, Renderer2, effect, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GoogleMapsModule } from '@angular/google-maps';
import { AddressSearchResult, GoogleMapsService } from '@app/core/service/google-maps/google-maps.service';
import { MapPoint } from '@app/core/service/google-maps/map-point.interface';
import { SidebarService } from '@app/core/service/sidebar.service';
import { UserLocationService } from '@app/core/service/user-location.service';
import { Subscription } from 'rxjs';

declare global {
  interface WindowEventMap {
    'user-coordinates-updated': CustomEvent;
    'monitors-found': CustomEvent;
  }
}

@Component({
  selector: 'app-maps',
  standalone: true,
  imports: [CommonModule, GoogleMapsModule, FormsModule],
  templateUrl: './maps.component.html',
  styleUrls: ['./maps.component.scss']
})
export class MapsComponent implements OnInit, OnDestroy {
  @Input() latitude?: number;
  @Input() longitude?: number;
  @Input() zoom = 15;
  @Input() 
  set height(value: string) {
    this._height = value;
    this.updateMapDimensions();
  }
  get height(): string {
    return this._height;
  }
  
  @Input() 
  set width(value: string) {
    this._width = value;
    this.updateMapDimensions();
  }
  get width(): string {
    return this._width;
  }
  
  private _height = '400px';
  private _width = '100%';
  
  @Input() points: MapPoint[] = [];
  @Input() showSearchBar = false;

  @Output() pointClick = new EventEmitter<{point: MapPoint, event: MouseEvent}>();
  
  calculatedHeight = '400px';
  calculatedWidth = '100%';
  
  center: google.maps.LatLngLiteral = {
    lat: -3.7327, 
    lng: -38.5270
  };
  
  markerOptions: google.maps.MarkerOptions = {
    draggable: false
  };
  
  markerPositions: google.maps.LatLngLiteral[] = [];
  markersConfig: { position: google.maps.LatLngLiteral, options: google.maps.MarkerOptions }[] = [];
  
  options: google.maps.MapOptions = {
    mapTypeId: 'roadmap',
    zoomControl: true,
    scrollwheel: false,
    disableDoubleClickZoom: true,
    maxZoom: 20,
    minZoom: 8,
  };
  
  apiLoaded = false;
  loadError: string | null = null;
  
  private readonly subscriptions = new Subscription();
  
  constructor(
    private readonly mapsService: GoogleMapsService,
    private readonly userLocationService: UserLocationService,
    private readonly sidebarService: SidebarService,
    private readonly ngZone: NgZone,
    private readonly el: ElementRef,
    private readonly renderer: Renderer2
  ) {
    effect(() => {
      const isVisible = this.sidebarService.visibilidade();
      
      if (isVisible !== null) {
        setTimeout(() => this.updateMapDimensions(), 100);
      }
    });
  }

  ngOnInit() {
    this.initializeMapCenter();
    
    this.mapsService.initGoogleMapsApi();
    
    this.mapsService.checkAndGeocodeStoredAddress();
    
    window.addEventListener('user-coordinates-updated', (event: Event) => {
      const customEvent = event as CustomEvent;
      this.ngZone.run(() => {
        if (customEvent.detail && customEvent.detail.latitude && customEvent.detail.longitude) {
          if (!this.hasExplicitCoordinates()) {
            console.log('Atualizando centro do mapa via evento:', customEvent.detail);
            this.center = {
              lat: customEvent.detail.latitude,
              lng: customEvent.detail.longitude
            };
          }
        }
      });
    });
    
    window.addEventListener('monitors-found', (event: Event) => {
      const customEvent = event as CustomEvent;
      this.ngZone.run(() => {
        if (customEvent.detail && customEvent.detail.monitors) {
          const monitors = customEvent.detail.monitors;
          if (monitors && monitors.length > 0) {
            this.clearMapPoints();
            this.addMapPoints(monitors);
            
            setTimeout(() => {
              if (monitors.length > 1) {
                this.fitBoundsToPoints(monitors);
              } else if (monitors.length === 1) {
                this.center = { 
                  lat: monitors[0].latitude, 
                  lng: monitors[0].longitude 
                };
                this.zoom = 16;
              }
            }, 100);
          }
        }
      });
    });
    
    this.subscriptions.add(
      this.userLocationService.getUserLocation().subscribe(location => {
        if (!this.hasExplicitCoordinates()) {
          this.center = {
            lat: location.latitude,
            lng: location.longitude
          };
        }
      })
    );
    
    this.subscriptions.add(
      this.mapsService.searchResult$.subscribe(result => {
        if (result) {
          this.handleSearchResult(result);
        }
      })
    );
    
    this.subscriptions.add(
      this.mapsService.apiLoaded$.subscribe(loaded => {
        this.apiLoaded = loaded;
      })
    );
    
    this.subscriptions.add(
      this.mapsService.apiError$.subscribe(error => {
        this.loadError = error;
      })
    );
    
    if (this.points && this.points.length > 0) {
      this.updateMapPoints();
    }
  }

  private hasExplicitCoordinates(): boolean {
    return this.latitude !== undefined && this.longitude !== undefined;
  }
  
  private initializeMapCenter(): void {
    if (this.hasExplicitCoordinates()) {
      this.center = {
        lat: this.latitude,
        lng: this.longitude
      };
      return;
    }
    
    const savedCoordinates = this.getSavedUserCoordinates();
    if (savedCoordinates) {
      this.center = {
        lat: savedCoordinates.latitude,
        lng: savedCoordinates.longitude
      };
      return;
    }
    
    const userLocation = this.userLocationService.getUserLocationValue();
    this.center = {
      lat: userLocation.latitude,
      lng: userLocation.longitude
    };
  }
  
  private getSavedUserCoordinates(): { latitude: number, longitude: number } | null {
    try {
      const savedData = localStorage.getItem('user_coordinates');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (parsed && parsed.latitude && parsed.longitude) {
          return {
            latitude: parsed.latitude,
            longitude: parsed.longitude
          };
        }
      }
    } catch (e) {
      console.error('Erro ao ler coordenadas salvas:', e);
    }
    return null;
  }
  
  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
  
  private handleSearchResult(result: AddressSearchResult): void {
    const { location } = result;
    
    this.center = {
      lat: location.latitude,
      lng: location.longitude
    };
    
    this.zoom = 16;
  }

  public addMapPoints(points: MapPoint[]): void {
    if (!points || points.length === 0) return;
    
    const pointsWithIds = points.map((point, index) => {
      if (!point.id) {
        return { ...point, id: `point-${Date.now()}-${index}` };
      }
      return point;
    });
    
    const existingIds = new Set(this.points.map(p => p.id));
    const newPoints = pointsWithIds.filter(p => !existingIds.has(p.id));
    
    if (newPoints.length > 0) {
      this.points = [...this.points, ...newPoints];
      this.updateMapPoints();
    }
  }
  
  public setMapPoints(points: MapPoint[]): void {
    this.points = points;
    this.updateMapPoints();
  }
 
  private updateMapPoints(): void {
    if (!this.points || this.points.length === 0) return;
    
    this.markerPositions = this.mapsService.convertToMarkerPositions(this.points);
    
    this.markersConfig = this.points.map((point, index) => {
      if (!point.icon) {
        point.icon = this.mapsService.createRedMarkerIcon() as any;
      }
      
      if (!point.id) {
        point.id = `point-${index}`;
      }
      
      return {
        position: {
          lat: point.latitude,
          lng: point.longitude
        },
        options: this.mapsService.createMarkerOptions(point)
      };
    });
  }
  
  public onMarkerClick(point: MapPoint, event: google.maps.MapMouseEvent): void {
    if (event && event.domEvent) {
      if (event.domEvent instanceof MouseEvent) {
        this.pointClick.emit({ point, event: event.domEvent });
      } else {
        const clientX = (event.domEvent as any).clientX || 0;
        const clientY = (event.domEvent as any).clientY || 0;
        const syntheticEvent = new MouseEvent('click', {
          clientX,
          clientY,
          bubbles: true,
          cancelable: true,
          view: window
        });
        this.pointClick.emit({ point, event: syntheticEvent });
      }
    }
  }

  public clearMapPoints(): void {
    this.points = [];
    this.markerPositions = [];
    this.markersConfig = [];
  }
  
  private updateMapDimensions(): void {
    const isMenuOpen = document.body.classList.contains('menu-open');
    const isMenuFixed = document.body.classList.contains('menu-fixed');
    const isMobile = window.innerWidth <= 768;
    
    if (isMenuFixed) {
      const windowWidth = window.innerWidth;
      const menuWidth = windowWidth > 768 ? 280 : 250;
      const maxAvailableWidth = windowWidth - menuWidth - 40;
      
      this.calculatedWidth = `${maxAvailableWidth}px`;
      this.calculatedHeight = this._height;
    } else if (isMenuOpen && !isMobile) {
      const windowWidth = window.innerWidth;
      const menuWidth = 280;
      const maxAvailableWidth = windowWidth - menuWidth - 40;
      
      this.calculatedWidth = `${maxAvailableWidth}px`;
      this.calculatedHeight = '100vh';
    } else {
      this.calculatedWidth = isMobile ? '100%' : this._width;
      this.calculatedHeight = '100vh';
    }
    
    setTimeout(() => {
      const mapElement = this.el.nativeElement.querySelector('google-map');
      if (mapElement) {
        const event = new Event('resize');
        window.dispatchEvent(event);
      }
    }, 200);
  }
  
  private fitBoundsToPoints(points: MapPoint[]): void {
    if (!points || points.length === 0 || !this.apiLoaded) return;
    
    const bounds = new google.maps.LatLngBounds();
    points.forEach((point: MapPoint) => {
      bounds.extend({ lat: point.latitude, lng: point.longitude });
    });
    
    const center = bounds.getCenter();
    this.center = { lat: center.lat(), lng: center.lng() };
    
    const northEast = bounds.getNorthEast();
    const southWest = bounds.getSouthWest();
    
    const latDiff = Math.abs(northEast.lat() - southWest.lat());
    const lngDiff = Math.abs(northEast.lng() - southWest.lng());
    
    let calculatedZoom = 15;
    
    if (latDiff > 1 || lngDiff > 1) {
      calculatedZoom = 8;
    } else if (latDiff > 0.5 || lngDiff > 0.5) {
      calculatedZoom = 9;
    } else if (latDiff > 0.25 || lngDiff > 0.25) {
      calculatedZoom = 10;
    } else if (latDiff > 0.1 || lngDiff > 0.1) {
      calculatedZoom = 12;
    } else if (latDiff > 0.05 || lngDiff > 0.05) {
      calculatedZoom = 13;
    } else if (latDiff > 0.025 || lngDiff > 0.025) {
      calculatedZoom = 14;
    } else if (latDiff > 0.01 || lngDiff > 0.01) {
      calculatedZoom = 15;
    } else {
      calculatedZoom = 16;
    }
    
    calculatedZoom = Math.max(8, Math.min(18, calculatedZoom));
    this.zoom = calculatedZoom;
    
    setTimeout(() => {
      const zoomEffect = () => {
        const currentZoom = this.zoom;
        this.zoom = currentZoom - 1;
        
        setTimeout(() => {
          this.zoom = calculatedZoom;
        }, 150);
      };
      
      if (points.length > 1) {
        zoomEffect();
      }
    }, 200);
  }
}
