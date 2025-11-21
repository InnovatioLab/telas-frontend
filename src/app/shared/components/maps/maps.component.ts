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
import { LeafletModule } from "@asymmetrik/ngx-leaflet";
import * as L from "leaflet";
import { GoogleMapsService } from "@app/core/service/api/google-maps.service";
import { LeafletMapService } from "@app/core/service/api/leaflet-map.service";
import { LoadingService } from "@app/core/service/state/loading.service";
import { MapPoint } from "@app/core/service/state/map-point.interface";
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

interface MonitorCluster {
  position: { lat: number; lng: number };
  monitors: MapPoint[];
  count: number;
}

@Component({
  selector: "app-maps",
  standalone: true,
  imports: [CommonModule, LeafletModule, FormsModule, IconsModule],
  template: `
    <div #mapContainer [style.width]="width" [style.height]="height"></div>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100vh;
        width: 100%;
        box-sizing: border-box;
      }

      div {
        border-radius: 8px;
        box-sizing: border-box;
        overflow: hidden;
      }

      div ::ng-deep .leaflet-container {
        border-radius: 0 !important;
      }

      div ::ng-deep .leaflet-tile-container {
        border-radius: 0 !important;
      }

      div ::ng-deep .leaflet-tile-container img {
        border-radius: 0 !important;
      }

      div ::ng-deep .leaflet-tile {
        border-radius: 0 !important;
      }
    `,
  ],
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

  @Output() pointClick = new EventEmitter<{
    point: MapPoint;
    event: MouseEvent;
  }>();
  @Output() mapInitialized = new EventEmitter<L.Map>();
  @Output() markerClicked = new EventEmitter<MapPoint>();
  @Output() mapReady = new EventEmitter<boolean>();
  @Output() mapError = new EventEmitter<string>();

  private _map: L.Map | null = null;
  private markers: L.Marker[] = [];
  private clusterMarkers: L.Marker[] = [];
  private readonly subscriptions: Subscription[] = [];
  private _mapReady = false;
  private readonly MIN_ZOOM_FOR_CLUSTERING = 14;
  private monitorIcon: L.Icon | null = null;
  private redMarkerIcon: L.Icon | null = null;

  constructor(
    private readonly mapsService: GoogleMapsService,
    private readonly leafletMapService: LeafletMapService,
    private readonly sidebarService: SidebarService,
    private readonly ngZone: NgZone,
    private readonly loadingService: LoadingService
  ) {
    this.initializeIcons();
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

  private initializeIcons(): void {
    this.monitorIcon = this.createMonitorIcon();
    this.redMarkerIcon = this.createRedMarkerIcon();
  }

  private createMonitorIcon(): L.Icon {
    const svg = `
      <svg width="32" height="32" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 3H4C2.9 3 2 3.9 2 5V17C2 18.1 2.9 19 4 19H8V21H16V19H20C21.1 19 22 18.1 22 17V5C22 3.9 21.1 3 20 3ZM20 17H4V5H20V17ZM6 7H18V15H6V7Z" fill="#111519" stroke="#FFFFFF" stroke-width="2"/>
      </svg>
    `;
    const svgBlob = new Blob([svg], { type: "image/svg+xml" });
    const svgUrl = URL.createObjectURL(svgBlob);
    return L.icon({
      iconUrl: svgUrl,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  }

  private createRedMarkerIcon(): L.Icon {
    const svg = `
      <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
        <circle cx="8" cy="8" r="8" fill="#FF0000" stroke="#FFFFFF" stroke-width="1"/>
      </svg>
    `;
    const svgBlob = new Blob([svg], { type: "image/svg+xml" });
    const svgUrl = URL.createObjectURL(svgBlob);
    return L.icon({
      iconUrl: svgUrl,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
  }

  public reloadMapApi(): void {
    this.forceReinitialize();
  }

  public forceReinitialize(): void {
    if (this._map) {
      this._map.remove();
      this._map = null;
    }

    this.clearMarkers();
    this._mapReady = false;
    this.initializeMap();
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
    this.initializeMap();
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
    if (!this._map && this.mapContainer?.nativeElement) {
      setTimeout(() => {
        this.initializeMap();
      }, 100);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.clearMarkers();

    if (this._map) {
      this._map.remove();
      this._map = null;
    }
  }

  private async initializeMap(): Promise<void> {
    if (!this.mapContainer?.nativeElement) {
      return;
    }

    if (this._map) {
      return;
    }

    try {
      const defaultCenter = { lat: 30.3322, lng: -81.6557 };
      const center = this.center || defaultCenter;

      this._map = await this.leafletMapService.initializeMap(
        this.mapContainer.nativeElement,
        center,
        this.zoom
      );

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
            this.mapReady.emit(true);
          });
        }
      }, 200);
    } catch (error) {
      this.ngZone.run(() => {
        this.mapError.emit(
          "Falha ao inicializar o mapa. Por favor, tente novamente."
        );
      });
      this._mapReady = false;
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

    if (currentZoom <= this.MIN_ZOOM_FOR_CLUSTERING) {
      this.createClusteredMarkers();
    } else {
      this.createIndividualMarkers();
    }
  }

  private calculateOffsetPosition(
    lat: number,
    lng: number,
    index: number,
    total: number
  ): { lat: number; lng: number } {
    const offset = 0.0002;
    const angle = (index / total) * 2 * Math.PI;

    return {
      lat: lat + offset * Math.cos(angle),
      lng: lng + offset * Math.sin(angle),
    };
  }

  private createMarker(point: MapPoint, lat: number, lng: number): void {
    if (!this._map) return;

    let icon: L.Icon;

    if (point.category === "MONITOR" || point.type === "MONITOR") {
      icon = this.monitorIcon!;
    } else {
      icon = this.redMarkerIcon!;
    }

    const marker = L.marker([lat, lng], {
      icon: icon,
      title: point.title || "",
    });

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
  }

  public setMapPoints(points: MapPoint[]): void {
    this.points = points;
    this.addMapPoints(points);

    if (points.length > 0) {
      this.fitBoundsToPoints(points);
    }
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

    points.forEach((point) => {
      const locationKey = `${point.latitude.toFixed(6)},${point.longitude.toFixed(6)}`;
      if (!locationGroups.has(locationKey)) {
        locationGroups.set(locationKey, []);
      }
      locationGroups.get(locationKey)!.push(point);
    });

    locationGroups.forEach((groupPoints, locationKey) => {
      const [lat, lng] = locationKey
        .split(",")
        .map((coord) => parseFloat(coord));

      clusters.push({
        position: { lat, lng },
        monitors: groupPoints,
        count: groupPoints.length,
      });
    });

    return clusters;
  }

  private createClusterMarker(cluster: MonitorCluster): void {
    if (!this._map) return;

    const clusterIcon = this.createClusterIcon(cluster.count, cluster.monitors);

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

  private createClusterIcon(
    count: number,
    monitors: MapPoint[]
  ): L.DivIcon {
    const size = Math.min(50 + count * 4, 80);

    let fillColor = "#FF6B35";
    const availableCount = monitors.filter(
      (m) => m.hasAvailableSlots === true
    ).length;
    const unavailableCount = monitors.filter(
      (m) => m.hasAvailableSlots === false
    ).length;

    if (availableCount === count) {
      fillColor = "#28a745";
    } else if (unavailableCount === count) {
      fillColor = "#6c757d";
    }

    const html = `
      <div style="
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background-color: ${fillColor};
        border: 4px solid #FFFFFF;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #FFFFFF;
        font-weight: bold;
        font-size: ${Math.min(14 + count, 18)}px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        position: relative;
      ">
        <div style="
          position: absolute;
          top: -8px;
          right: -8px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background-color: #FFFFFF;
          border: 3px solid ${fillColor};
          display: flex;
          align-items: center;
          justify-content: center;
          color: ${fillColor};
          font-weight: bold;
          font-size: 12px;
        ">${count}</div>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
          <path d="M20 3H4C2.9 3 2 3.9 2 5V17C2 18.1 2.9 19 4 19H8V21H16V19H20C21.1 19 22 18.1 22 17V5C22 3.9 21.1 3 20 3ZM20 17H4V5H20V17ZM6 7H18V15H6V7Z"/>
        </svg>
      </div>
    `;

    return L.divIcon({
      html: html,
      className: "custom-cluster-icon",
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  }

  private clearMarkers(): void {
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
              icon: this.redMarkerIcon!,
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
              icon: this.redMarkerIcon!,
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
