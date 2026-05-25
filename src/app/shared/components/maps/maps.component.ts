import { CommonModule } from "@angular/common";
import {
  AfterViewInit,
  Component,
  effect,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { LeafletModule } from "@bluehalo/ngx-leaflet";
import * as L from "leaflet";
import { GoogleMapsService } from "@app/core/service/api/google-maps.service";
import {
  LeafletClusterService,
  MonitorCluster,
} from "@app/core/service/api/leaflet-cluster.service";
import { LeafletMapService } from "@app/core/service/api/leaflet-map.service";
import { MapMarkerIconService } from "@app/core/service/api/map-marker-icon.service";
import { LoadingService } from "@app/core/service/state/loading.service";
import { MapPoint } from "@app/core/service/state/map-point.interface";
import { getMonitorAddressLines } from "@app/core/service/utils/monitor-address-label.util";
import { SidebarService } from "@app/core/service/state/sidebar.service";
import { IconsModule } from "@app/shared/icons/icons.module";
import { Subscription } from "rxjs";

declare global {
  interface WindowEventMap {
    "user-coordinates-updated": CustomEvent;
    "monitors-found": CustomEvent;
    "monitor-cluster-clicked": CustomEvent;
  }
}

@Component({
  selector: "app-maps",
  standalone: true,
  imports: [CommonModule, LeafletModule, FormsModule, IconsModule],
  templateUrl: "./maps.component.html",
  styleUrls: ["./maps.component.scss"],
})
export class MapsComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @ViewChild("mapContainer") mapContainer!: ElementRef;
  @Input() latitude?: number;
  @Input() longitude?: number;
  @Input() zoom = 15;
  @Input() height = "100%";
  @Input() width = "100%";
  @Input() points: MapPoint[] = [];
  @Input() showSearchBar = false;
  @Input() center: { lat: number; lng: number } | null = null;
  @Input() showMonitorHealth = false;
  @Input() useBrandMonitorColor = false;

  @Output() pointClick = new EventEmitter<{
    point: MapPoint;
    event: MouseEvent;
  }>();
  @Output() mapInitialized = new EventEmitter<L.Map>();
  @Output() markerClicked = new EventEmitter<MapPoint>();
  @Output() mapReady = new EventEmitter<L.Map>();
  @Output() mapError = new EventEmitter<string>();

  private _map: L.Map | null = null;
  private markers: L.Marker[] = [];
  private clusterMarkers: L.Marker[] = [];
  private readonly subscriptions: Subscription[] = [];
  private _mapReady = false;
  private monitorMarkers: Map<L.Marker, MapPoint> = new Map();
  private markersByMonitorId = new Map<string, L.Marker>();
  private hoveredMarkerId: string | null = null;
  private containerResizeObserver: ResizeObserver | null = null;
  private mapInitPromise: Promise<void> | null = null;
  private mapInitGeneration = 0;
  private resizeObserverFrameId: number | null = null;
  private destroyed = false;

  constructor(
    private readonly mapsService: GoogleMapsService,
    private readonly leafletMapService: LeafletMapService,
    private readonly leafletClusterService: LeafletClusterService,
    private readonly markerIconService: MapMarkerIconService,
    private readonly sidebarService: SidebarService,
    private readonly ngZone: NgZone,
    private readonly loadingService: LoadingService
  ) {
    effect(() => {
      const isVisible = this.sidebarService.visibilidade();
      const tipo = this.sidebarService.tipo();

      if (tipo === "admin-menu") {
        const isMenuFixed = document.body.classList.contains("menu-fixed");
        if (isMenuFixed) {
          this.updateMapDimensions();
        }
        return;
      }

      if (tipo === "alert-admin-sidebar") {
        const isSidebarPinned =
          document.body.classList.contains("sidebar-pinned");
        if (isSidebarPinned) {
          this.updateMapDimensions();
        }
        return;
      }

      if (tipo === "client-menu") {
        return;
      }

      if (isVisible !== null) {
        this.updateMapDimensions();
      }
    });
  }

  private getMarkerIconOptions() {
    return {
      useBrandMonitorColor: this.useBrandMonitorColor,
      showMonitorHealth: this.showMonitorHealth,
    };
  }

  public reloadMapApi(): void {
    this.forceReinitialize();
  }

  public forceReinitialize(): void {
    this.destroyMapInstance();
    this._mapReady = false;
    void this.initializeMap();
  }

  public ensureMapInitialized(): void {
    if (!this._map) {
      this.initializeMap();
    } else if (!this._mapReady) {
      setTimeout(() => {
        if (this._map) {
          this._map.invalidateSize();
          this.ngZone.run(() => {
            this._mapReady = true;
            this.mapReady.emit(this._map);
          });
        }
      }, 200);
    } else if (this._mapReady) {
      this.ngZone.run(() => {
        if (this._map) {
          this.mapReady.emit(this._map);
        }
      });
    }
  }

  ngOnInit() {
    this.setupEventListeners();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['center'] && changes['center'].currentValue && this._map) {
      this.updateMapCenter(changes['center'].currentValue);
    }
    
    if (changes['zoom'] && changes['zoom'].currentValue && this._map) {
      this._map.setZoom(changes['zoom'].currentValue);
    }
  }

  ngAfterViewInit(): void {
    this.observeContainerAndInitialize();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    if (this.resizeObserverFrameId != null) {
      cancelAnimationFrame(this.resizeObserverFrameId);
      this.resizeObserverFrameId = null;
    }
    this.containerResizeObserver?.disconnect();
    this.containerResizeObserver = null;
    this.mapInitPromise = null;
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.clearMarkers();
    this.destroyMapInstance();
  }

  private destroyMapInstance(): void {
    this.mapInitGeneration++;
    const container = this.mapContainer?.nativeElement as HTMLElement | undefined;
    const mapInstance = this._map;
    this._map = null;
    this._mapReady = false;
    this.mapInitPromise = null;
    this.leafletMapService.destroyMapForContainer(
      container ?? null,
      mapInstance
    );
  }

  private observeContainerAndInitialize(): void {
    const element = this.mapContainer?.nativeElement as HTMLElement | undefined;
    if (!element) {
      return;
    }

    const tryInitialize = (): void => {
      if (this.destroyed) {
        return;
      }

      if (this._map) {
        this.updateMapDimensions();
        return;
      }

      if (!this.hasContainerSize(element)) {
        return;
      }

      void this.initializeMap();
    };

    tryInitialize();

    if (typeof ResizeObserver === "undefined") {
      setTimeout(tryInitialize, 150);
      return;
    }

    this.containerResizeObserver?.disconnect();
    this.containerResizeObserver = new ResizeObserver(() => {
      if (this.resizeObserverFrameId != null) {
        cancelAnimationFrame(this.resizeObserverFrameId);
      }
      this.resizeObserverFrameId = requestAnimationFrame(() => {
        this.resizeObserverFrameId = null;
        this.ngZone.run(() => tryInitialize());
      });
    });
    this.containerResizeObserver.observe(element);
  }

  private hasContainerSize(element: HTMLElement): boolean {
    const candidates = [element, element.parentElement].filter(
      (node): node is HTMLElement => node instanceof HTMLElement
    );

    return candidates.some(
      (node) => node.clientHeight > 0 && node.clientWidth > 0
    );
  }

  private async initializeMap(): Promise<void> {
    if (this.destroyed || this._map) {
      return;
    }

    if (this.mapInitPromise) {
      return this.mapInitPromise;
    }

    if (!this.mapContainer?.nativeElement) {
      return;
    }

    if (!this.hasContainerSize(this.mapContainer.nativeElement)) {
      return;
    }

    const generation = ++this.mapInitGeneration;
    this.mapInitPromise = this.createMapInstance(generation);

    try {
      await this.mapInitPromise;
    } finally {
      this.mapInitPromise = null;
    }
  }

  private async createMapInstance(generation: number): Promise<void> {
    if (
      this.destroyed ||
      !this.mapContainer?.nativeElement ||
      this._map
    ) {
      return;
    }

    const container = this.mapContainer.nativeElement as HTMLElement;

    try {
      const defaultCenter = { lat: 30.3322, lng: -81.6557 };
      const center = this.center || defaultCenter;

      const map = await this.leafletMapService.initializeMap(
        container,
        center,
        this.zoom
      );

      if (this.destroyed || generation !== this.mapInitGeneration) {
        this.leafletMapService.destroyMapForContainer(container, map);
        return;
      }

      this._map = map;

      this.ngZone.run(() => {
        this.mapInitialized.emit(this._map!);
      });

      this._map.on("zoomend", () => {
        if (this._map && this.points && this.points.length > 0) {
          this.updateMarkersBasedOnZoom();
        }
      });

      if (this.points && this.points.length > 0) {
        this.addMapPoints(this.points);
      }

      setTimeout(() => {
        if (this._map) {
          this._map.invalidateSize();
          this.ngZone.run(() => {
            this._mapReady = true;
            this.mapReady.emit(this._map);
          });
        }
      }, 200);
    } catch {
      this.leafletMapService.destroyMapForContainer(container, this._map);
      this._map = null;
      this._mapReady = false;
      this.ngZone.run(() => {
        this.mapError.emit(
          "Falha ao inicializar o mapa. Por favor, tente novamente."
        );
      });
    }
  }

  public isMapReady(): boolean {
    return this._mapReady && !!this._map;
  }

  public checkMapState(): void {
    if (!this._map && this.mapContainer?.nativeElement) {
      this.initializeMap();
    }
  }

  private hasExplicitCoordinates(): boolean {
    return this.latitude !== undefined && this.longitude !== undefined;
  }

  private initializeMapCenter(): void {
    if (this.center) {
      return;
    }

    if (this.hasExplicitCoordinates()) {
      this.center = {
        lat: this.latitude!,
        lng: this.longitude!,
      };
      return;
    }

    const savedCoords = this.getSavedUserCoordinates();
    if (savedCoords) {
      this.center = {
        lat: savedCoords.latitude,
        lng: savedCoords.longitude,
      };
    } else {
      this.center = {
        lat: 30.3322,
        lng: -81.6557,
      };
    }
  }

  private getSavedUserCoordinates(): {
    latitude: number;
    longitude: number;
  } | null {
    try {
      const savedData = localStorage.getItem("user_coordinates");
      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (parsed && parsed.latitude && parsed.longitude) {
          return {
            latitude: parsed.latitude,
            longitude: parsed.longitude,
          };
        }
      }
    } catch (e) {
    }
    return null;
  }

  private addMapPoints(points: MapPoint[]): void {
    if (!this._map) return;

    this.clearMarkers();

    const currentZoom = this._map.getZoom() || 15;

    if (this.leafletClusterService.shouldCluster(currentZoom)) {
      this.createClusteredMarkers();
    } else {
      this.createIndividualMarkers();
    }
  }

  private createMarker(point: MapPoint, lat: number, lng: number): void {
    if (!this._map) return;

    const isMonitor = point.category === "MONITOR" || point.type === "MONITOR";
    const icon = this.markerIconService.getBaseIconForPoint(
      point,
      this.getMarkerIconOptions()
    );

    const marker = L.marker([lat, lng], {
      icon: icon,
    });

    if (isMonitor) {
      this.bindCustomTooltip(marker, point);
    } else {
      marker.bindTooltip(point.title || "", {
        permanent: false,
        direction: "top",
        offset: [0, -10],
      });
    }

    marker.on("click", () => {
      this.ngZone.run(() => {
        this.markerClicked.emit(point);
        this.mapsService.selectPoint(point);

        const customEvent = new CustomEvent("monitor-marker-clicked", {
          detail: { point },
        });
        window.dispatchEvent(customEvent);
      });
    });

    marker.addTo(this._map);
    this.markers.push(marker);

    if (isMonitor) {
      this.monitorMarkers.set(marker, point);
      const monitorId = point.id;
      marker.on("remove", () => {
        this.monitorMarkers.delete(marker);
        if (monitorId) {
          this.markersByMonitorId.delete(monitorId);
        }
      });
      if (monitorId) {
        this.markersByMonitorId.set(monitorId, marker);
      }
    }
  }

  private bindCustomTooltip(marker: L.Marker, point: MapPoint): void {
    const tooltipElement = this.createTooltipElement(point);
    
    marker.bindTooltip(tooltipElement, {
      className: "custom-monitor-tooltip",
      permanent: false,
      direction: "top",
      offset: [0, -12],
      opacity: 1,
      interactive: false,
    });

    marker.on("tooltipopen", () => {
      setTimeout(() => {
        this.updateTooltipContent(marker, point);
      }, 10);
    });
  }

  private createTooltipElement(point: MapPoint): HTMLElement {
    const container = L.DomUtil.create("div", "custom-tooltip-content");
    container.classList.add("light-theme");
    container.setAttribute("data-theme", "light");
    
    container.style.setProperty('display', 'block', 'important');
    container.style.setProperty('background', '#ffffff', 'important');
    container.style.setProperty('background-color', '#ffffff', 'important');
    container.style.setProperty('border', '1px solid rgba(0, 0, 0, 0.08)', 'important');
    container.style.setProperty('box-shadow', '0 8px 24px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)', 'important');
    container.style.setProperty('border-radius', '12px', 'important');
    container.style.setProperty('padding', '10px 14px', 'important');
    container.style.setProperty('min-width', '140px', 'important');
    container.style.setProperty('max-width', '280px', 'important');
    container.style.setProperty('box-sizing', 'border-box', 'important');

    const { line1, line2 } = getMonitorAddressLines(point);

    const title = L.DomUtil.create("div", "tooltip-title", container);
    title.textContent = line1;
    (title as HTMLElement).style.setProperty('color', '#111519', 'important');
    (title as HTMLElement).style.setProperty('font-weight', '600', 'important');
    (title as HTMLElement).style.setProperty('font-size', '14px', 'important');
    (title as HTMLElement).style.setProperty('margin', '0', 'important');
    (title as HTMLElement).style.setProperty('padding', '0', 'important');
    (title as HTMLElement).style.setProperty('line-height', '1.5', 'important');
    if (line2) {
      (title as HTMLElement).style.setProperty('white-space', 'normal', 'important');
      (title as HTMLElement).style.setProperty('overflow', 'visible', 'important');
      const sub = L.DomUtil.create("div", "tooltip-subtitle", container);
      sub.textContent = line2;
      (sub as HTMLElement).style.setProperty('color', 'rgba(17, 21, 25, 0.72)', 'important');
      (sub as HTMLElement).style.setProperty('font-weight', '400', 'important');
      (sub as HTMLElement).style.setProperty('font-size', '12px', 'important');
      (sub as HTMLElement).style.setProperty('margin-top', '4px', 'important');
      (sub as HTMLElement).style.setProperty('line-height', '1.45', 'important');
      (sub as HTMLElement).style.setProperty('white-space', 'normal', 'important');
    } else {
      (title as HTMLElement).style.setProperty('white-space', 'nowrap', 'important');
      (title as HTMLElement).style.setProperty('overflow', 'hidden', 'important');
      (title as HTMLElement).style.setProperty('text-overflow', 'ellipsis', 'important');
    }

    return container;
  }

  private applyInlineStyles(element: HTMLElement): void {
    if (!element) return;
    
    element.style.setProperty('display', 'block', 'important');
    element.style.setProperty('background', '#ffffff', 'important');
    element.style.setProperty('background-color', '#ffffff', 'important');
    element.style.setProperty('border', '1px solid rgba(0, 0, 0, 0.08)', 'important');
    element.style.setProperty('box-shadow', '0 8px 24px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)', 'important');
    element.style.setProperty('border-radius', '12px', 'important');
    element.style.setProperty('padding', '10px 14px', 'important');
    element.style.setProperty('min-width', '140px', 'important');
    element.style.setProperty('max-width', '280px', 'important');
    element.style.setProperty('box-sizing', 'border-box', 'important');
    
    const titleElement = element.querySelector('.tooltip-title') as HTMLElement;
    if (titleElement) {
      titleElement.style.setProperty('color', '#111519', 'important');
    }
  }

  private updateTooltipContent(marker: L.Marker, point: MapPoint): void {
    const tooltip = marker.getTooltip();
    if (!tooltip) return;

    const container = tooltip.getElement();
    if (!container) return;

    container.classList.remove("dark-theme");
    container.classList.add("light-theme");
    container.setAttribute("data-theme", "light");
    this.applyInlineStyles(container);

    const { line1, line2 } = getMonitorAddressLines(point);

    const titleElement = container.querySelector(".tooltip-title");
    if (titleElement) {
      titleElement.textContent = line1;
      (titleElement as HTMLElement).style.setProperty('color', '#111519', 'important');
      if (line2) {
        (titleElement as HTMLElement).style.setProperty('white-space', 'normal', 'important');
        (titleElement as HTMLElement).style.setProperty('overflow', 'visible', 'important');
      } else {
        (titleElement as HTMLElement).style.setProperty('white-space', 'nowrap', 'important');
        (titleElement as HTMLElement).style.setProperty('overflow', 'hidden', 'important');
        (titleElement as HTMLElement).style.setProperty('text-overflow', 'ellipsis', 'important');
      }
    }

    const existingSub = container.querySelector(".tooltip-subtitle");
    if (line2) {
      let sub = existingSub;
      if (!sub) {
        sub = L.DomUtil.create("div", "tooltip-subtitle", container);
      }
      sub.textContent = line2;
      (sub as HTMLElement).style.setProperty('color', 'rgba(17, 21, 25, 0.72)', 'important');
      (sub as HTMLElement).style.setProperty('font-weight', '400', 'important');
      (sub as HTMLElement).style.setProperty('font-size', '12px', 'important');
      (sub as HTMLElement).style.setProperty('margin-top', '4px', 'important');
      (sub as HTMLElement).style.setProperty('line-height', '1.45', 'important');
      (sub as HTMLElement).style.setProperty('white-space', 'normal', 'important');
    } else if (existingSub) {
      existingSub.remove();
    }
  }


  public setMapPoints(
    points: MapPoint[],
    options?: { fitBounds?: boolean }
  ): void {
    const fitBounds = options?.fitBounds !== false;
    this.points = points;
    this.addMapPoints(points);

    if (points.length > 0 && fitBounds) {
      this.fitBoundsToPoints(points);
    }
  }

  public getLeafletMap(): L.Map | null {
    return this._map;
  }

  public onMarkerClick(
    point: MapPoint,
    event: MouseEvent
  ): void {
    this.pointClick.emit({ point, event });
  }

  public clearMapPoints(): void {
    this.points = [];
  }

  private updateMarkersBasedOnZoom(): void {
    if (!this._map || !this.points || this.points.length === 0) return;

    const currentZoom = this._map.getZoom() || 15;
    this.clearMarkers();

    if (this.leafletClusterService.shouldCluster(currentZoom)) {
      this.createClusteredMarkers();
    } else {
      this.createIndividualMarkers();
    }
  }

  private createClusteredMarkers(): void {
    if (!this._map) return;

    const clusters = this.leafletClusterService.createClusters(this.points);

    clusters.forEach((cluster) => {
      if (cluster.count === 1) {
        this.createMarker(
          cluster.monitors[0],
          cluster.position.lat,
          cluster.position.lng
        );
      } else {
        this.createClusterMarker(cluster);
      }
    });
  }

  private createIndividualMarkers(): void {
    const locationGroups = new Map<string, MapPoint[]>();

    this.points.forEach((point) => {
      const key = `${point.latitude.toFixed(6)},${point.longitude.toFixed(6)}`;
      if (!locationGroups.has(key)) {
        locationGroups.set(key, []);
      }
      locationGroups.get(key)!.push(point);
    });

    locationGroups.forEach((groupPoints) => {
      if (groupPoints.length === 1) {
        this.createMarker(
          groupPoints[0],
          groupPoints[0].latitude,
          groupPoints[0].longitude
        );
      } else {
        groupPoints.forEach((point, index) => {
          const offsetPosition = this.leafletClusterService.calculateOffsetPosition(
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

  private createClusterMarker(cluster: MonitorCluster): void {
    if (!this._map) return;

    const clusterIcon = this.leafletClusterService.createClusterIcon(
      cluster.count,
      cluster.monitors,
      {
        useBrandMonitorColor: this.useBrandMonitorColor,
        showMonitorHealth: this.showMonitorHealth,
      }
    );

    const clusterMarker = L.marker([cluster.position.lat, cluster.position.lng], {
      icon: clusterIcon,
      title: `${cluster.count} monitores neste local`,
      zIndexOffset: 1000,
    });

    clusterMarker.on("click", () => {
      this.ngZone.run(() => {
        if (this._map) {
          const currentZoom = this._map.getZoom() || 15;

          if (currentZoom < 16) {
            this._map.setZoom(16);
            this._map.setView([cluster.position.lat, cluster.position.lng]);
          } else {
            this.showClusterDetails(cluster);
          }
        }
      });
    });

    clusterMarker.addTo(this._map);
    this.clusterMarkers.push(clusterMarker);
  }

  private showClusterDetails(cluster: MonitorCluster): void {
    const customEvent = new CustomEvent("monitor-cluster-clicked", {
      detail: {
        cluster,
        monitors: cluster.monitors,
        position: cluster.position,
      },
    });
    window.dispatchEvent(customEvent);

    if (cluster.monitors.length > 0) {
      this.mapsService.selectPoint(cluster.monitors[0]);
    }
  }

  private clearMarkers(): void {
    this.resetHoveredMarkerVisual();
    this.markers.forEach((marker) => {
      if (this._map) {
        this._map.removeLayer(marker);
      }
    });
    this.markers = [];
    this.clusterMarkers.forEach((marker) => {
      if (this._map) {
        this._map.removeLayer(marker);
      }
    });
    this.clusterMarkers = [];
    this.monitorMarkers.clear();
    this.markersByMonitorId.clear();
  }

  private resetHoveredMarkerVisual(): void {
    if (!this.hoveredMarkerId) {
      return;
    }
    const id = this.hoveredMarkerId;
    this.hoveredMarkerId = null;
    const prevMarker = this.markersByMonitorId.get(id);
    const prevPoint = this.points.find((p) => p.id === id);
    if (prevMarker && prevPoint) {
      prevMarker.setIcon(
        this.markerIconService.getBaseIconForPoint(
          prevPoint,
          this.getMarkerIconOptions()
        )
      );
      prevMarker.setZIndexOffset(0);
    }
  }

  public setHoveredMonitor(monitorId: string | null): void {
    if (!this._map) {
      return;
    }

    this.resetHoveredMarkerVisual();

    if (!monitorId) {
      return;
    }

    const marker = this.markersByMonitorId.get(monitorId);
    const point = this.points.find((p) => p.id === monitorId);
    if (!marker || !point) {
      return;
    }

    marker.setIcon(
      this.markerIconService.getHoverIconForPoint(
        point,
        this.getMarkerIconOptions()
      )
    );
    marker.setZIndexOffset(600);
    this.hoveredMarkerId = monitorId;
  }

  private updateMapDimensions(): void {
    if (!this._map) {
      return;
    }

    setTimeout(() => {
      if (this._map) {
        this._map.invalidateSize();
      }
    }, 100);
  }

  public fitBoundsToPoints(points: MapPoint[]): void {
    if (!points || points.length === 0 || !this._map) return;

    const bounds = L.latLngBounds(
      points.map((point: MapPoint) => [point.latitude, point.longitude])
    );

    this._map.fitBounds(bounds, {
      padding: [50, 50],
    });

    this._map.once("zoomend", () => {
      if (this._map) {
        const currentZoom = this._map.getZoom();
        if (currentZoom && currentZoom > 15) {
          this._map.setZoom(15);
        }
      }
    });
  }

  public setMapCenter(center: { lat: number; lng: number }): void {
    if (this._map) {
      this._map.setView([center.lat, center.lng], this._map.getZoom());
    }
  }

  private updateMapCenter(center: { lat: number; lng: number }): void {
    this.center = center;
    
    if (this._map) {
      this._map.setView([center.lat, center.lng], this._map.getZoom());
    }
  }

  private setupEventListeners(): void {
    window.addEventListener("zipcode-location-found", ((e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.location) {
        const location = customEvent.detail.location;
        if (this._map && location.latitude && location.longitude) {
          this.ngZone.run(() => {
            const newCenter = {
              lat: location.latitude,
              lng: location.longitude,
            };
            this._map?.setView([newCenter.lat, newCenter.lng], 15);

            this.clearMarkers();
            const marker = L.marker([newCenter.lat, newCenter.lng], {
              icon: this.markerIconService.getRedMarkerIcon(),
              title: location.title ?? "Localização do CEP",
            });
            marker.addTo(this._map);
            this.markers.push(marker);
          });
        }
      }
    }) as EventListener);

    window.addEventListener("user-coordinates-updated", ((e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.latitude && customEvent.detail?.longitude) {
        const newCenter = {
          lat: customEvent.detail.latitude,
          lng: customEvent.detail.longitude,
        };

        if (this._map) {
          this.ngZone.run(() => {
            this._map?.setView([newCenter.lat, newCenter.lng], 15);

            this.clearMarkers();
            const marker = L.marker([newCenter.lat, newCenter.lng], {
              icon: this.markerIconService.getRedMarkerIcon(),
              title: "Localização atual",
            });
            marker.addTo(this._map);
            this.markers.push(marker);
          });
        }
      }
    }) as EventListener);

    window.addEventListener("focus", () => {
      if (!this._map) {
        setTimeout(() => {
          this.initializeMap();
        }, 500);
      }
    });

    window.addEventListener("pageshow", (event) => {
      if (event.persisted) {
        setTimeout(() => {
          this.ensureMapInitialized();
        }, 1000);
      }
    });

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && !this._map) {
        setTimeout(() => {
          this.initializeMap();
        }, 500);
      }
    });

    window.addEventListener("admin-menu-pin-changed", () => {
      setTimeout(() => {
        this.updateMapDimensions();
      }, 300);
    });

    window.addEventListener("admin-sidebar-pin-changed", (event: any) => {
      setTimeout(() => {
        this.updateMapDimensions();
      }, 300);
    });

    window.addEventListener("admin-menu-loaded", () => {
      setTimeout(() => {
        this.updateMapDimensions();
      }, 300);
    });

    window.addEventListener("admin-menu-closed", () => {
      setTimeout(() => {
        this.updateMapDimensions();
      }, 300);
    });

    const userCoordsSub = this.mapsService.savedPoints$.subscribe(
      (points: MapPoint[]) => {
        if (this._map && points.length > 0) {
          this.addMapPoints(points);
        }
      }
    );

    const monitorsSub = this.mapsService.nearestMonitors$.subscribe(
      (monitors: MapPoint[]) => {
        if (this._map && monitors.length > 0) {
          this.addMapPoints(monitors);
        }
      }
    );

    window.addEventListener("monitors-found", ((e: Event) => {
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
}
