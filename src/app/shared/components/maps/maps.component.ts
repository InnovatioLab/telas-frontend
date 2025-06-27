import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, OnDestroy, NgZone, ElementRef, effect, EventEmitter, Output, AfterViewInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GoogleMapsModule } from '@angular/google-maps';
import { GoogleMapsService } from '@app/core/service/api/google-maps.service';
import { MapPoint } from '@app/core/service/state/map-point.interface';
import { SidebarService } from '@app/core/service/state/sidebar.service';
import { IconsModule } from '@app/shared/icons/icons.module';
import { Subscription } from 'rxjs';
import { LoadingService } from '@app/core/service/state/loading.service';

declare global {
  interface WindowEventMap {
    'user-coordinates-updated': CustomEvent;
    'monitors-found': CustomEvent;
  }
}

@Component({
  selector: 'app-maps',
  standalone: true,
  imports: [CommonModule, GoogleMapsModule, FormsModule, IconsModule],
  template: `
    <div #mapContainer [style.width]="width" [style.height]="height"></div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
      width: 100%;
    }
    div {
      border-radius: 8px;
      overflow: hidden;
      height: 100vh;
      width: 100%;
    }
  `]
})
export class MapsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef;
  @Input() latitude?: number;
  @Input() longitude?: number;
  @Input() zoom = 15;
  @Input() height = '100vh';
  @Input() width = '100%';
  @Input() points: MapPoint[] = [];
  @Input() showSearchBar = false;
  @Input() center: { lat: number; lng: number } | null = null;

  @Output() pointClick = new EventEmitter<{point: MapPoint, event: MouseEvent}>();
  @Output() mapInitialized = new EventEmitter<google.maps.Map>();
  @Output() markerClicked = new EventEmitter<MapPoint>();
  
  private map: google.maps.Map | null = null;
  private markers: google.maps.Marker[] = [];
  private readonly subscriptions: Subscription[] = [];
  private _apiLoaded = false;
  private _mapReady = false;
  private markerPositions: google.maps.LatLngLiteral[] = [];
  private markersConfig: { position: google.maps.LatLngLiteral, options: google.maps.MarkerOptions }[] = [];
  
  constructor(
    private readonly mapsService: GoogleMapsService,
    private readonly sidebarService: SidebarService,
    private readonly ngZone: NgZone,
    private readonly el: ElementRef,
    private readonly loadingService: LoadingService
  ) {
    effect(() => {
      const isVisible = this.sidebarService.visibilidade();
      const tipo = this.sidebarService.tipo();
      
      // Para admin-menu: só recalcular quando estiver fixado (menu-fixed)
      if (tipo === 'admin-menu') {
        const isMenuFixed = document.body.classList.contains('menu-fixed');
        if (isMenuFixed) {
          this.updateMapDimensions();
        }
        return;
      }
      
      if (tipo === 'alert-admin-sidebar') {
        const isSidebarPinned = document.body.classList.contains('sidebar-pinned');
        if (isSidebarPinned) {
          this.updateMapDimensions();
        }
        return;
      }
      
      if (tipo === 'client-menu') {
        return;
      }
      
      if (isVisible !== null) {
        this.updateMapDimensions();
      }
    });
  }

  public reloadMapApi(): void {
    this.mapsService.initGoogleMapsApi();
  }
  
  public forceReinitialize(): void {
    if (this.map) {
      this.map = null;
    }
    
    this.clearMarkers();
    
    this._apiLoaded = false;
    this._mapReady = false;
    
    this.loadGoogleMapsScript();
  }

  public ensureMapInitialized(): void {
    if (!this._apiLoaded) {
      this.loadGoogleMapsScript();
    } else if (!this.map) {
      this.initializeMap();
    } else if (!this._mapReady) {
      setTimeout(() => {
        if (this.map) {
          google.maps.event.trigger(this.map, 'resize');
          this._mapReady = true;
        }
      }, 200);
    }
  }

  ngOnInit() {
    this.loadGoogleMapsScript();
    this.setupEventListeners();
  }
  
  ngAfterViewInit(): void {
    if (this._apiLoaded && !this.map && this.mapContainer?.nativeElement) {
    setTimeout(() => {
        this.initializeMap();
      }, 100);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.clearMarkers();
    
    if (this.map) {
      this.map = null;
    }
  }
  
  private loadGoogleMapsScript(): void {
    this.loadingService.setLoading(true, 'load-google-maps');
    
    if (typeof google !== 'undefined' && google.maps) {
      this._apiLoaded = true;
      this.loadingService.setLoading(false, 'load-google-maps');
      this.initializeMap();
      return;
    }
    
    this.mapsService.initGoogleMapsApi();

    const subscription = this.mapsService.apiLoaded$.subscribe((loaded: boolean) => {
      if (loaded) {
        this._apiLoaded = true;
        this.loadingService.setLoading(false, 'load-google-maps');
        
        setTimeout(() => {
        this.initializeMap();
        }, 100);
      }
    });

    this.subscriptions.push(subscription);
  }
  
  private setupEventListeners(): void {
    window.addEventListener('zipcode-location-found', ((e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.location) {
        const location = customEvent.detail.location;
        if (this.map && location.latitude && location.longitude) {
          this.ngZone.run(() => {
            const newCenter = { lat: location.latitude, lng: location.longitude };
            this.map?.setCenter(newCenter);
            this.map?.setZoom(15);
            
            this.clearMarkers();
            const marker = new google.maps.Marker({
              position: newCenter,
              map: this.map,
              title: location.title ?? 'Localização do CEP',
              icon: this.mapsService.createRedMarkerIcon()
            });
            this.markers.push(marker);
          });
        }
      }
    }) as EventListener);

    window.addEventListener('user-coordinates-updated', ((e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.latitude && customEvent.detail?.longitude) {
        const newCenter = {
          lat: customEvent.detail.latitude,
          lng: customEvent.detail.longitude
        };
        
        if (this.map) {
          this.ngZone.run(() => {
            this.map?.setCenter(newCenter);
            this.map?.setZoom(15);
            
            this.clearMarkers();
            const marker = new google.maps.Marker({
              position: newCenter,
              map: this.map,
              title: 'Localização atual',
              icon: this.mapsService.createRedMarkerIcon()
            });
            this.markers.push(marker);
          });
        }
      }
    }) as EventListener);

    window.addEventListener('focus', () => {
      if (this._apiLoaded && !this.map) {
        setTimeout(() => {
          this.initializeMap();
        }, 500);
      }
    });

    window.addEventListener('pageshow', (event) => {
      if (event.persisted) {
        setTimeout(() => {
          this.ensureMapInitialized();
        }, 1000);
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this._apiLoaded && !this.map) {
        setTimeout(() => {
          this.initializeMap();
        }, 500);
      }
    });

    window.addEventListener('admin-menu-pin-changed', () => {
      const isMenuFixed = document.body.classList.contains('menu-fixed');
      setTimeout(() => {
        this.updateMapDimensions();
      }, 300);
    });

    window.addEventListener('admin-sidebar-pin-changed', (event: any) => {
      const isPinned = event.detail?.pinned;
      setTimeout(() => {
        this.updateMapDimensions();
      }, 300);
    });

    window.addEventListener('admin-menu-loaded', () => {
      const isMenuFixed = document.body.classList.contains('menu-fixed');
      setTimeout(() => {
        this.updateMapDimensions();
      }, 300);
    });

    window.addEventListener('admin-menu-closed', () => {
      const isMenuFixed = document.body.classList.contains('menu-fixed');
      setTimeout(() => {
        this.updateMapDimensions();
      }, 300);
    });

    const userCoordsSub = this.mapsService.savedPoints$.subscribe((points: MapPoint[]) => {
      if (this.map && points.length > 0) {
        this.addMapPoints(points);
      }
    });

    const monitorsSub = this.mapsService.nearestMonitors$.subscribe((monitors: MapPoint[]) => {
      if (this.map && monitors.length > 0) {
        this.addMapPoints(monitors);
      }
    });

    this.subscriptions.push(userCoordsSub, monitorsSub);
  }
  
  private initializeMap(): void {
    if (!this.mapContainer?.nativeElement) {
      return;
    }
    
    if (!this._apiLoaded) {
      return;
    }
    
    if (typeof google === 'undefined' || !google.maps) {
      return;
    }
    
    if (this.map) {
      return;
    }

    try {
      const defaultCenter = { lat: -3.7327, lng: -38.5270 };
      const center = this.center || defaultCenter;

      this.map = new google.maps.Map(this.mapContainer.nativeElement, {
        center,
        zoom: this.zoom,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false
      });

      this.mapInitialized.emit(this.map);
      
      if (this.points && this.points.length > 0) {
        this.addMapPoints(this.points);
      }
      
      setTimeout(() => {
        if (this.map) {
          google.maps.event.trigger(this.map, 'resize');
          this._mapReady = true;
        }
      }, 200);
    } catch (error) {
      this._apiLoaded = false;
      this._mapReady = false;
    }
  }
  
  public isMapReady(): boolean {
    return this._mapReady && this._apiLoaded && !!this.map;
  }
  
  public checkMapState(): void {
    if (this._apiLoaded && !this.map && this.mapContainer?.nativeElement) {
      this.initializeMap();
    }
  }
  
  private forceMapResize(): void {
    window.dispatchEvent(new Event('resize'));
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
    
    const savedCoords = this.getSavedUserCoordinates();
    if (savedCoords) {
      this.center = {
        lat: savedCoords.latitude,
        lng: savedCoords.longitude
      };
    } else {
      this.center = {
        lat: -3.7327, 
        lng: -38.5270
      };
    }
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

  private addMapPoints(points: MapPoint[]): void {
    if (!this.map) return;

    this.clearMarkers();

    points.forEach(point => {
      const marker = new google.maps.Marker({
        position: { lat: point.latitude, lng: point.longitude },
        map: this.map,
        title: point.title || '',
        icon: this.mapsService.createRedMarkerIcon()
      });

      marker.addListener('click', () => {
        this.markerClicked.emit(point);
      });

      this.markers.push(marker);
    });
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
    if (!this.map) {
      return;
    }

    const isMenuFixed = document.body.classList.contains('menu-fixed');
    const isSidebarPinned = document.body.classList.contains('sidebar-pinned');

    const originalWidth = this.el.nativeElement.style.width;
    const originalHeight = this.el.nativeElement.style.height;

    if (isMenuFixed || isSidebarPinned) {
      const menuWidth = isMenuFixed ? 280 : 0;
      const sidebarWidth = isSidebarPinned ? 320 : 0;
      const totalOffset = menuWidth + sidebarWidth;

      if (totalOffset > 0) {
        const newWidth = `calc(100% - ${totalOffset}px)`;
        this.el.nativeElement.style.width = newWidth;
        this.el.nativeElement.style.height = '100vh';
      }
    } else {
      this.el.nativeElement.style.width = originalWidth;
      this.el.nativeElement.style.height = originalHeight;
    }

    setTimeout(() => {
      if (this.map) {
        google.maps.event.trigger(this.map, 'resize');
      }
    }, 100);
  }
  
  private fitBoundsToPoints(points: MapPoint[]): void {
    if (!points || points.length === 0 || !this._apiLoaded) return;
    
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
  }

  private clearMarkers(): void {
    this.markers.forEach(marker => marker.setMap(null));
    this.markers = [];
  }

  get apiLoaded(): boolean {
    return this._apiLoaded;
  }
  
  get mapReady(): boolean {
    return this._mapReady;
  }
}
