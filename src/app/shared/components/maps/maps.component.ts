import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, OnDestroy, NgZone, ElementRef, effect, EventEmitter, Output, AfterViewInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GoogleMapsModule } from '@angular/google-maps';
import { AddressSearchResult, GoogleMapsService } from '@app/core/service/api/google-maps.service';
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
    }
    div {
      border-radius: 8px;
      overflow: hidden;
    }
  `]
})
export class MapsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef;
  @Input() latitude?: number;
  @Input() longitude?: number;
  @Input() zoom = 15;
  @Input() height = '400px';
  @Input() width = '100%';
  @Input() points: MapPoint[] = [];
  @Input() showSearchBar = false;
  @Input() center: { lat: number; lng: number } | null = null;

  @Output() pointClick = new EventEmitter<{point: MapPoint, event: MouseEvent}>();
  @Output() mapInitialized = new EventEmitter<google.maps.Map>();
  @Output() markerClicked = new EventEmitter<MapPoint>();
  
  private map: google.maps.Map | null = null;
  private markers: google.maps.Marker[] = [];
  private subscriptions: Subscription[] = [];
  private _apiLoaded = false;
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
      if (isVisible !== null) {
        this.updateMapDimensions();
      }
    });
  }

  ngOnInit() {
    this.loadGoogleMapsScript();
    this.setupEventListeners();
  }
  
  ngAfterViewInit(): void {
    setTimeout(() => {
      this.forceMapResize();
    }, 500);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.clearMarkers();
  }
  
  private loadGoogleMapsScript(): void {
    this.loadingService.setLoading(true, 'load-google-maps');
    this.mapsService.initGoogleMapsApi();

    const subscription = this.mapsService.apiLoaded$.subscribe((loaded: boolean) => {
      if (loaded) {
        this._apiLoaded = true;
        this.loadingService.setLoading(false, 'load-google-maps');
        this.initializeMap();
      }
    });

    this.subscriptions.push(subscription);
  }
  
  private setupEventListeners(): void {
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
    if (!this.mapContainer?.nativeElement || !this._apiLoaded) return;

    const defaultCenter = { lat: -3.7327, lng: -38.5270 };
    const center = this.center || defaultCenter;

    this.map = new google.maps.Map(this.mapContainer.nativeElement, {
      center,
      zoom: 15,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false
    });

    this.mapInitialized.emit(this.map);
    this.addMapPoints(this.points);
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
    const isMenuOpen = document.body.classList.contains('menu-open');
    const isMenuFixed = document.body.classList.contains('menu-fixed');
    const isMobile = window.innerWidth <= 768;
    
    if (isMenuFixed) {
      const windowWidth = window.innerWidth;
      const menuWidth = windowWidth > 768 ? 280 : 250;
      const maxAvailableWidth = windowWidth - menuWidth - 40;
      
      this.width = `${maxAvailableWidth}px`;
      this.height = this.height;
    } else if (isMenuOpen && !isMobile) {
      const windowWidth = window.innerWidth;
      const menuWidth = 280;
      const maxAvailableWidth = windowWidth - menuWidth - 40;
      
      this.width = `${maxAvailableWidth}px`;
      this.height = '100vh';
    } else {
      this.width = isMobile ? '100%' : this.width;
      this.height = '100vh';
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
}
