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
  private subscriptions: Subscription[] = [];
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
      
      // Para alert-admin-sidebar: só recalcular quando estiver fixado (sidebar-pinned)
      if (tipo === 'alert-admin-sidebar') {
        const isSidebarPinned = document.body.classList.contains('sidebar-pinned');
        if (isSidebarPinned) {
          this.updateMapDimensions();
        }
        return;
      }
      
      // Para outros tipos de sidebar (ex: client-menu): não recalcular
      if (tipo === 'client-menu') {
        return;
      }
      
      // Para outros tipos não especificados: recalcular normalmente
      if (isVisible !== null) {
        this.updateMapDimensions();
      }
    });
  }

  public reloadMapApi(): void {
    this.mapsService.initGoogleMapsApi();
  }
  
  public forceReinitialize(): void {
    console.log('Forcing map reinitialization');
    
    // Limpar o mapa atual
    if (this.map) {
      this.map = null;
    }
    
    // Limpar marcadores
    this.clearMarkers();
    
    // Resetar estado
    this._apiLoaded = false;
    this._mapReady = false;
    
    // Recarregar a API
    this.loadGoogleMapsScript();
  }

  public ensureMapInitialized(): void {
    if (!this._apiLoaded) {
      console.log('API not loaded, initializing...');
      this.loadGoogleMapsScript();
    } else if (!this.map) {
      console.log('API loaded but map not initialized, initializing map...');
      this.initializeMap();
    } else if (!this._mapReady) {
      console.log('Map exists but not ready, triggering resize...');
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
    // Verificar se a API já está carregada e o mapa não foi inicializado
    if (this._apiLoaded && !this.map && this.mapContainer?.nativeElement) {
      setTimeout(() => {
        this.initializeMap();
      }, 100);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.clearMarkers();
    
    // Limpar o mapa para evitar vazamentos de memória
    if (this.map) {
      this.map = null;
    }
  }
  
  private loadGoogleMapsScript(): void {
    this.loadingService.setLoading(true, 'load-google-maps');
    
    // Verificar se a API já está carregada
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
        
        // Aguardar um pouco para garantir que o DOM está pronto
        setTimeout(() => {
          this.initializeMap();
        }, 100);
      }
    });

    this.subscriptions.push(subscription);
  }
  
  private setupEventListeners(): void {
    // Adicionar listener para o evento zipcode-location-found
    window.addEventListener('zipcode-location-found', ((e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.location) {
        const location = customEvent.detail.location;
        if (this.map && location.latitude && location.longitude) {
          this.ngZone.run(() => {
            const newCenter = { lat: location.latitude, lng: location.longitude };
            this.map?.setCenter(newCenter);
            this.map?.setZoom(15);
            
            // Criar um marcador para a localização
            this.clearMarkers();
            const marker = new google.maps.Marker({
              position: newCenter,
              map: this.map,
              title: location.title || 'Localização do CEP',
              icon: this.mapsService.createRedMarkerIcon()
            });
            this.markers.push(marker);
          });
        }
      }
    }) as EventListener);

    // Listener para o evento user-coordinates-updated
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
            
            // Adicionar um marcador na posição atual
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

    // Listener para detectar quando a janela ganha foco
    window.addEventListener('focus', () => {
      if (this._apiLoaded && !this.map) {
        console.log('Window gained focus, checking map initialization');
        setTimeout(() => {
          this.initializeMap();
        }, 500);
      }
    });

    // Listener para detectar quando o usuário navega de volta para a página
    window.addEventListener('pageshow', (event) => {
      if (event.persisted) {
        console.log('Page restored from cache, checking map state');
        setTimeout(() => {
          this.ensureMapInitialized();
        }, 1000);
      }
    });

    // Listener para detectar quando a página se torna visível novamente
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this._apiLoaded && !this.map) {
        console.log('Page became visible, checking map initialization');
        setTimeout(() => {
          this.initializeMap();
        }, 500);
      }
    });

    // Listener para detectar quando o admin-menu é fixado/desfixado
    window.addEventListener('admin-menu-pin-changed', () => {
      const isMenuFixed = document.body.classList.contains('menu-fixed');
      console.log('Admin menu pin changed, menu-fixed:', isMenuFixed);
      setTimeout(() => {
        this.updateMapDimensions();
      }, 300);
    });

    // Listener para detectar quando o alert-admin-sidebar é fixado/desfixado
    window.addEventListener('admin-sidebar-pin-changed', (event: any) => {
      const isPinned = event.detail?.pinned;
      console.log('Alert admin sidebar pin changed, pinned:', isPinned);
      setTimeout(() => {
        this.updateMapDimensions();
      }, 300);
    });

    // Listener para detectar quando o admin-menu é carregado inicialmente
    window.addEventListener('admin-menu-loaded', () => {
      const isMenuFixed = document.body.classList.contains('menu-fixed');
      console.log('Admin menu loaded, menu-fixed:', isMenuFixed);
      if (isMenuFixed) {
        setTimeout(() => {
          this.updateMapDimensions();
        }, 300);
      }
    });

    // Listener para detectar quando o admin-menu é fechado
    window.addEventListener('admin-menu-closed', () => {
      const isMenuFixed = document.body.classList.contains('menu-fixed');
      console.log('Admin menu closed, menu-fixed:', isMenuFixed);
      if (!isMenuFixed) {
        setTimeout(() => {
          this.updateMapDimensions();
        }, 300);
      }
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
      console.warn('Map container not available');
      return;
    }
    
    if (!this._apiLoaded) {
      console.warn('Google Maps API not loaded yet');
      return;
    }
    
    if (typeof google === 'undefined' || !google.maps) {
      console.warn('Google Maps not available');
      return;
    }
    
    // Se o mapa já existe, não recriar
    if (this.map) {
      console.log('Map already initialized');
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
      
      // Adicionar pontos se existirem
      if (this.points && this.points.length > 0) {
        this.addMapPoints(this.points);
      }
      
      // Forçar um resize para garantir que o mapa se ajuste corretamente
      setTimeout(() => {
        if (this.map) {
          google.maps.event.trigger(this.map, 'resize');
          this._mapReady = true;
        }
      }, 200);
      
      console.log('Map initialized successfully');
    } catch (error) {
      console.error('Error initializing map:', error);
      this._apiLoaded = false;
      this._mapReady = false;
    }
  }
  
  public isMapReady(): boolean {
    return this._mapReady && this._apiLoaded && !!this.map;
  }
  
  public checkMapState(): void {
    if (this._apiLoaded && !this.map && this.mapContainer?.nativeElement) {
      console.log('Map state check: API loaded but map not initialized, reinitializing...');
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
    const isMenuOpen = document.body.classList.contains('menu-open');
    const isMenuFixed = document.body.classList.contains('menu-fixed');
    const isAdminSidebarOpen = document.body.classList.contains('admin-sidebar-open');
    const isSidebarPinned = document.body.classList.contains('sidebar-pinned');
    const isMobile = window.innerWidth <= 768;
    
    console.log('Updating map dimensions:', {
      isMenuOpen,
      isMenuFixed,
      isAdminSidebarOpen,
      isSidebarPinned,
      isMobile
    });
    
    // Calcular largura disponível baseada nos sidebars fixados
    let availableWidth = window.innerWidth;
    let marginLeft = 0;
    let marginRight = 0;
    
    // Se o admin-menu está fixado, reduzir largura da esquerda
    if (isMenuFixed && !isMobile) {
      const menuWidth = 280;
      availableWidth -= menuWidth;
      marginLeft = menuWidth;
    }
    
    // Se o alert-admin-sidebar está fixado, reduzir largura da direita
    if (isSidebarPinned && !isMobile) {
      const sidebarWidth = 480;
      availableWidth -= sidebarWidth;
      marginRight = sidebarWidth;
    }
    
    // Aplicar as dimensões calculadas
    if (isMenuFixed || isSidebarPinned) {
      this.width = `${availableWidth}px`;
      this.height = '100vh';
      
      // Aplicar margens se necessário
      if (marginLeft > 0) {
        this.el.nativeElement.style.marginLeft = `${marginLeft}px`;
      }
      if (marginRight > 0) {
        this.el.nativeElement.style.marginRight = `${marginRight}px`;
      }
      
      console.log('Map dimensions adjusted for fixed sidebars:', {
        width: this.width,
        height: this.height,
        marginLeft,
        marginRight,
        availableWidth
      });
    } else {
      // Reset para dimensões padrão quando nenhum sidebar está fixado
      this.width = '100%';
      this.height = '100vh';
      this.el.nativeElement.style.marginLeft = '0';
      this.el.nativeElement.style.marginRight = '0';
      
      console.log('Map dimensions reset to original:', {
        width: this.width,
        height: this.height
      });
    }
    
    // Forçar resize do mapa após ajuste de dimensões
    setTimeout(() => {
      if (this.map) {
        google.maps.event.trigger(this.map, 'resize');
      }
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
  
  get mapReady(): boolean {
    return this._mapReady;
  }
}
