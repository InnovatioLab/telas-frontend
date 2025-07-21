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
    'monitor-cluster-clicked': CustomEvent;
  }
}

interface MonitorCluster {
  position: { lat: number; lng: number };
  monitors: MapPoint[];
  count: number;
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
  @Output() mapReady = new EventEmitter<boolean>();
  @Output() mapError = new EventEmitter<string>();
  
  private _map: google.maps.Map | null = null;
  private markers: google.maps.Marker[] = [];
  private clusterMarkers: google.maps.Marker[] = [];
  private readonly subscriptions: Subscription[] = [];
  private _apiLoaded = false;
  private _mapReady = false;
  private markerPositions: google.maps.LatLngLiteral[] = [];
  private markersConfig: { position: google.maps.LatLngLiteral, options: google.maps.MarkerOptions }[] = [];
  private readonly CLUSTER_DISTANCE_THRESHOLD = 0.0001;
  private readonly MIN_ZOOM_FOR_CLUSTERING = 14;
  
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
    if (this._map) {
      this._map = null;
    }
    
    this.clearMarkers();
    
    this._apiLoaded = false;
    this._mapReady = false;
    
    this.loadGoogleMapsScript();
  }

  public ensureMapInitialized(): void {
    if (!this._apiLoaded) {
      this.loadGoogleMapsScript();
    } else if (!this._map) {
      this.initializeMap();
    } else if (!this._mapReady) {
      setTimeout(() => {
        if (this._map) {
          google.maps.event.trigger(this._map, 'resize');
          this.ngZone.run(() => {
          this._mapReady = true;
            this.mapReady.emit(true);
          });
        }
      }, 200);
    } else if (this._mapReady) {
      this.ngZone.run(() => {
        this.mapReady.emit(true);
      });
    }
  }

  ngOnInit() {
    this.loadGoogleMapsScript();
    this.setupEventListeners();
  }
  
  ngAfterViewInit(): void {
    if (this._apiLoaded && !this._map && this.mapContainer?.nativeElement) {
    setTimeout(() => {
        this.initializeMap();
      }, 100);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.clearMarkers();
    
    if (this._map) {
      this._map = null;
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

    const errorSubscription = this.mapsService.apiError$.subscribe(error => {
      if (error) {
        this.ngZone.run(() => {
          this.mapError.emit(error);
        });
        this.loadingService.setLoading(false, 'load-google-maps');
      }
    });

    this.subscriptions.push(subscription, errorSubscription);
  }
  
  private setupEventListeners(): void {
    window.addEventListener('zipcode-location-found', ((e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.location) {
        const location = customEvent.detail.location;
        if (this._map && location.latitude && location.longitude) {
          this.ngZone.run(() => {
            const newCenter = { lat: location.latitude, lng: location.longitude };
            this._map?.setCenter(newCenter);
            this._map?.setZoom(15);
            
            this.clearMarkers();
            const marker = new google.maps.Marker({
              position: newCenter,
              map: this._map,
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
        
        if (this._map) {
          this.ngZone.run(() => {
            this._map?.setCenter(newCenter);
            this._map?.setZoom(15);
            
            this.clearMarkers();
            const marker = new google.maps.Marker({
              position: newCenter,
              map: this._map,
              title: 'Localização atual',
              icon: this.mapsService.createRedMarkerIcon()
            });
            this.markers.push(marker);
          });
        }
      }
    }) as EventListener);

    window.addEventListener('focus', () => {
      if (this._apiLoaded && !this._map) {
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
      if (!document.hidden && this._apiLoaded && !this._map) {
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
      if (this._map && points.length > 0) {
        this.addMapPoints(points);
      }
    });

    const monitorsSub = this.mapsService.nearestMonitors$.subscribe((monitors: MapPoint[]) => {
      if (this._map && monitors.length > 0) {
        this.addMapPoints(monitors);
      }
    });

    window.addEventListener('monitors-found', ((e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.monitors) {
        const monitors: MapPoint[] = customEvent.detail.monitors;
        if (this._map) {
          this.setMapPoints(monitors);
        } else {
          setTimeout(() => {
            if (this._map) {
              this.setMapPoints(monitors);
            }
          }, 1000);
        }
      }
    }) as EventListener);

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
    
    if (this._map) {
      return;
    }

    try {
      const defaultCenter = { lat: -3.7327, lng: -38.5270 };
      const center = this.center || defaultCenter;

      this._map = new google.maps.Map(this.mapContainer.nativeElement, {
        center,
        zoom: this.zoom,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false
      });

      this.ngZone.run(() => {
      this.mapInitialized.emit(this._map);
      });
      
      this._map.addListener('zoom_changed', () => {
        if (this._map && this.points && this.points.length > 0) {
          this.updateMarkersBasedOnZoom();
        }
      });
      
      if (this.points && this.points.length > 0) {
        this.addMapPoints(this.points);
      }
      
      setTimeout(() => {
        if (this._map) {
          google.maps.event.trigger(this._map, 'resize');
          this.ngZone.run(() => {
          this._mapReady = true;
            this.mapReady.emit(true);
          });
        }
      }, 200);
    } catch (error) {
      this.ngZone.run(() => {
        this.mapError.emit('Falha ao inicializar o mapa. Por favor, tente novamente.');
      });
      this._apiLoaded = false;
      this._mapReady = false;
    }
  }
  
  public isMapReady(): boolean {
    return this._mapReady && this._apiLoaded && !!this._map;
  }
  
  public checkMapState(): void {
    if (this._apiLoaded && !this._map && this.mapContainer?.nativeElement) {
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
    if (!this._map) return;

    this.clearMarkers();
    
    const currentZoom = this._map.getZoom() || 15;
    
    if (currentZoom <= this.MIN_ZOOM_FOR_CLUSTERING) {
      this.createClusteredMarkers();
    } else {
      this.createIndividualMarkers();
    }
  }

  private calculateOffsetPosition(lat: number, lng: number, index: number, total: number): { lat: number, lng: number } {
    const offset = 0.0002;
    const angle = (index / total) * 2 * Math.PI;
    
    return {
      lat: lat + (offset * Math.cos(angle)),
      lng: lng + (offset * Math.sin(angle))
    };
  }

  private createMarker(point: MapPoint, lat: number, lng: number): void {
    let icon: google.maps.Symbol;
    
    if (point.category === 'MONITOR' || point.type === 'MONITOR') {
      icon = this.mapsService.createMonitorIcon();
    } else {
      icon = this.mapsService.createRedMarkerIcon();
    }

    const marker = new google.maps.Marker({
      position: { lat, lng },
      map: this._map,
      title: point.title || '',
      icon: icon
    });

    marker.addListener('click', () => {
      this.ngZone.run(() => {
        this.markerClicked.emit(point);
        
        this.mapsService.selectPoint(point);
        
        const customEvent = new CustomEvent('monitor-marker-clicked', {
          detail: { point }
        });
        window.dispatchEvent(customEvent);
      });
    });

    this.markers.push(marker);
  }
  
  public setMapPoints(points: MapPoint[]): void {
    this.points = points;
    
    this.addMapPoints(points);
    
    if (points.length > 0) {
      this.fitBoundsToPoints(points);
    }
  }
 
  private updateMapPoints(): void {
    if (!this.points || this.points.length === 0) return;
    
    this.markerPositions = this.mapsService.convertToMarkerPositions(this.points);
    
    this.markersConfig = this.points.map((point, index) => {
      point.icon ??= this.mapsService.createRedMarkerIcon() as any;
      
      point.id ??= `point-${index}`;
      
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
    if (event?.domEvent) {
      if (event.domEvent instanceof MouseEvent) {
        this.pointClick.emit({ point, event: event.domEvent });
      } else {
        const clientX = (event.domEvent as any)?.clientX ?? 0;
        const clientY = (event.domEvent as any)?.clientY ?? 0;
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
  
  private updateMarkersBasedOnZoom(): void {
    if (!this._map || !this.points || this.points.length === 0) return;
    
    const currentZoom = this._map.getZoom() || 15;
    this.clearMarkers();
    
    if (currentZoom <= this.MIN_ZOOM_FOR_CLUSTERING) {
      this.createClusteredMarkers();
    } else {
      this.createIndividualMarkers();
    }
  }

  private createClusteredMarkers(): void {
    if (!this._map) return;
    
    const clusters = this.createClusters(this.points);
    
    clusters.forEach((cluster) => {
      if (cluster.count === 1) {
        this.createMarker(cluster.monitors[0], cluster.position.lat, cluster.position.lng);
      } else {
        this.createClusterMarker(cluster);
      }
    });
  }

  private createIndividualMarkers(): void {
    const locationGroups = new Map<string, MapPoint[]>();
    
    this.points.forEach(point => {
      const key = `${point.latitude.toFixed(6)},${point.longitude.toFixed(6)}`;
      if (!locationGroups.has(key)) {
        locationGroups.set(key, []);
      }
      locationGroups.get(key)!.push(point);
    });

    locationGroups.forEach((groupPoints) => {
      if (groupPoints.length === 1) {
        this.createMarker(groupPoints[0], groupPoints[0].latitude, groupPoints[0].longitude);
      } else {
        groupPoints.forEach((point, index) => {
          const offsetPosition = this.calculateOffsetPosition(
            point.latitude, 
            point.longitude, 
            index, 
            groupPoints.length
          );
          this.createMarker(point, offsetPosition.lat, offsetPosition.lng);
        });
      }
    });
  }

  private createClusters(points: MapPoint[]): MonitorCluster[] {
    const clusters: MonitorCluster[] = [];
    const locationGroups = new Map<string, MapPoint[]>();
    
    points.forEach(point => {
      const locationKey = `${point.latitude.toFixed(6)},${point.longitude.toFixed(6)}`;
      if (!locationGroups.has(locationKey)) {
        locationGroups.set(locationKey, []);
      }
      locationGroups.get(locationKey)!.push(point);
    });
    
    locationGroups.forEach((groupPoints, locationKey) => {
      const [lat, lng] = locationKey.split(',').map(coord => parseFloat(coord));
      
      clusters.push({
        position: { lat, lng },
        monitors: groupPoints,
        count: groupPoints.length
      });
    });
    
    return clusters;
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const dLat = Math.abs(lat1 - lat2);
    const dLng = Math.abs(lng1 - lng2);
    return Math.sqrt(dLat * dLat + dLng * dLng);
  }

  private createClusterMarker(cluster: MonitorCluster): void {
    if (!this._map) return;
    
    const clusterIcon = this.createClusterIcon(cluster.count, cluster.monitors);
    
    const clusterMarker = new google.maps.Marker({
      position: cluster.position,
      map: this._map,
      title: `${cluster.count} monitores neste local`,
      icon: clusterIcon,
      zIndex: 1000
    });
    
    clusterMarker.addListener('click', () => {
      this.ngZone.run(() => {
        if (this._map) {
          const currentZoom = this._map.getZoom() || 15;
          
          if (currentZoom < 16) {
            this._map.setZoom(16);
            this._map.setCenter(cluster.position);
          } else {
            this.showClusterDetails(cluster);
          }
        }
      });
    });
    
    this.clusterMarkers.push(clusterMarker);
  }
  
  private showClusterDetails(cluster: MonitorCluster): void {
    const customEvent = new CustomEvent('monitor-cluster-clicked', {
      detail: { 
        cluster,
        monitors: cluster.monitors,
        position: cluster.position
      }
    });
    window.dispatchEvent(customEvent);
    
    if (cluster.monitors.length > 0) {
      this.mapsService.selectPoint(cluster.monitors[0]);
    }
  }

  private createClusterIcon(count: number, monitors: MapPoint[]): google.maps.Icon {
    const size = Math.min(50 + (count * 4), 80);
    
    let fillColor = '#FF6B35';
    const availableCount = monitors.filter(m => m.hasAvailableSlots === true).length;
    const unavailableCount = monitors.filter(m => m.hasAvailableSlots === false).length;
    
    if (availableCount === count) {
      fillColor = '#28a745';
    } else if (unavailableCount === count) {
      fillColor = '#6c757d';
    }
    
    const svg = `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${size/2 + 3}" cy="${size/2 + 3}" r="${size/2 - 3}" fill="rgba(0,0,0,0.3)"/>
        <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 3}" fill="${fillColor}" stroke="#FFFFFF" stroke-width="4"/>
        <rect x="${size/2 - 8}" y="${size/2 - 10}" width="16" height="10" rx="2" fill="#FFFFFF" opacity="0.9"/>
        <rect x="${size/2 - 7}" y="${size/2 - 9}" width="14" height="8" rx="1" fill="${fillColor}"/>
        <circle cx="${size/2 + 12}" cy="${size/2 - 12}" r="12" fill="#FFFFFF" stroke="${fillColor}" stroke-width="3"/>
        <text x="${size/2 + 12}" y="${size/2 - 7}" text-anchor="middle" font-family="Arial, sans-serif" 
              font-size="14" font-weight="bold" fill="${fillColor}">${count}</text>
      </svg>
    `;
    
    const svgBlob = new Blob([svg], { type: 'image/svg+xml' });
    const svgUrl = URL.createObjectURL(svgBlob);
    
    return {
      url: svgUrl,
      scaledSize: new google.maps.Size(size, size),
      anchor: new google.maps.Point(size/2, size/2)
    };
  }

  private clearMarkers(): void {
    this.markers.forEach(marker => marker.setMap(null));
    this.markers = [];
    this.clusterMarkers.forEach(marker => marker.setMap(null));
    this.clusterMarkers = [];
  }

  private updateMapDimensions(): void {
    if (!this._map) {
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
      if (this._map) {
        google.maps.event.trigger(this._map, 'resize');
      }
    }, 100);
  }
  
  private fitBoundsToPoints(points: MapPoint[]): void {
    if (!points || points.length === 0 || !this._map) return;
    
    const bounds = new google.maps.LatLngBounds();
    points.forEach((point: MapPoint) => {
      bounds.extend({ lat: point.latitude, lng: point.longitude });
    });
    
    this._map.fitBounds(bounds);
    
    const listener = google.maps.event.addListener(this._map, 'bounds_changed', () => {
      if (this._map) {
        const currentZoom = this._map.getZoom();
        if (currentZoom && currentZoom > 15) {
          this._map.setZoom(15);
        }
      }
      google.maps.event.removeListener(listener);
    });
  }
}
