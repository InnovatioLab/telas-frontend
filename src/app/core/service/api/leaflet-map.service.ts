import { Injectable } from "@angular/core";
import * as L from "leaflet";
import { IMapService } from "@app/core/interfaces/services/map-service.interface";
import { MapPoint } from "@app/core/service/state/map-point.interface";

type LeafletDomNode = HTMLElement & { _leaflet_id?: number };
type LeafletMapWithId = L.Map & { _leaflet_id?: number };

@Injectable({
  providedIn: "root",
})
export class LeafletMapService implements IMapService {
  private readonly mapsByContainer = new WeakMap<HTMLElement, L.Map>();
  private readonly removedMaps = new WeakSet<L.Map>();
  private activeMap: L.Map | null = null;
  private markers: L.Marker[] = [];
  private zoomChangeCallbacks: ((zoom: number) => void)[] = [];
  private mapClickCallbacks: ((event: L.LeafletMouseEvent) => void)[] = [];

  async initializeMap(
    container: HTMLElement,
    center: { lat: number; lng: number },
    zoom: number
  ): Promise<L.Map> {
    this.destroyMapForContainer(container);

    const maxBounds = L.latLngBounds(
      L.latLng(-85, -180),
      L.latLng(85, 180)
    );

    const map = L.map(container, {
      center: [center.lat, center.lng],
      zoom: zoom,
      zoomControl: true,
      minZoom: 2,
      maxZoom: 19,
      maxBounds: maxBounds,
      maxBoundsViscosity: 1.0,
      worldCopyJump: false,
    });

    this.mapsByContainer.set(container, map);
    this.activeMap = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      minZoom: 2,
      noWrap: false,
      crossOrigin: true,
      tileSize: 256,
      zoomOffset: 0,
    }).addTo(map);

    map.on("zoomend", () => {
      const currentZoom = map.getZoom();
      this.zoomChangeCallbacks.forEach((callback) => callback(currentZoom));
    });

    map.on("click", (event: L.LeafletMouseEvent) => {
      this.mapClickCallbacks.forEach((callback) => callback(event));
    });

    return map;
  }

  addMarker(
    point: MapPoint,
    onClick?: (point: MapPoint) => void
  ): L.Marker {
    if (!this.activeMap) {
      throw new Error("Map not initialized");
    }

    const marker = L.marker([point.latitude, point.longitude], {
      title: point.title || "",
    });

    if (onClick) {
      marker.on("click", () => {
        onClick(point);
      });
    }

    marker.addTo(this.activeMap);
    this.markers.push(marker);

    return marker;
  }

  removeMarker(marker: L.Marker): void {
    if (this.activeMap) {
      this.activeMap.removeLayer(marker);
      const index = this.markers.indexOf(marker);
      if (index > -1) {
        this.markers.splice(index, 1);
      }
    }
  }

  clearAllMarkers(): void {
    this.markers.forEach((marker) => {
      if (this.activeMap) {
        this.activeMap.removeLayer(marker);
      }
    });
    this.markers = [];
  }

  fitBounds(points: MapPoint[]): void {
    if (!this.activeMap || points.length === 0) return;

    const bounds = L.latLngBounds(
      points.map((point) => [point.latitude, point.longitude])
    );

    this.activeMap.fitBounds(bounds, {
      padding: [50, 50],
    });
  }

  setCenter(center: { lat: number; lng: number }): void {
    if (this.activeMap) {
      this.activeMap.setView([center.lat, center.lng], this.activeMap.getZoom());
    }
  }

  setZoom(zoom: number): void {
    if (this.activeMap) {
      this.activeMap.setZoom(zoom);
    }
  }

  getZoom(): number {
    return this.activeMap ? this.activeMap.getZoom() : 15;
  }

  onZoomChange(callback: (zoom: number) => void): void {
    this.zoomChangeCallbacks.push(callback);
  }

  onMapClick(callback: (event: L.LeafletMouseEvent) => void): void {
    this.mapClickCallbacks.push(callback);
  }

  getMapInstance(): L.Map | null {
    return this.activeMap;
  }

  destroyExistingMap(
    container?: HTMLElement | null,
    mapInstance?: L.Map | null
  ): void {
    this.destroyMapForContainer(container, mapInstance);
  }

  destroyMapForContainer(
    container?: HTMLElement | null,
    mapInstance?: L.Map | null
  ): void {
    const mapsToRemove = new Set<L.Map>();

    if (container) {
      const tracked = this.mapsByContainer.get(container);
      if (tracked) {
        mapsToRemove.add(tracked);
        this.mapsByContainer.delete(container);
      }
    }

    if (
      mapInstance &&
      !mapsToRemove.has(mapInstance) &&
      (!container || !this.mapOwnsContainer(mapInstance, container))
    ) {
      mapsToRemove.add(mapInstance);
    }

    for (const map of mapsToRemove) {
      if (this.activeMap === map) {
        this.activeMap = null;
      }
      this.safeRemoveMap(map);
    }

    if (container) {
      this.resetLeafletContainer(container);
    }
  }

  private mapOwnsContainer(map: L.Map, container: HTMLElement): boolean {
    const containerId = (container as LeafletDomNode)._leaflet_id;
    const mapId = (map as LeafletMapWithId)._leaflet_id;
    return (
      containerId != null && mapId != null && containerId === mapId
    );
  }

  private safeRemoveMap(map: L.Map): void {
    if (this.removedMaps.has(map)) {
      return;
    }

    const mapContainer = map.getContainer?.();
    if (!mapContainer) {
      this.removedMaps.add(map);
      return;
    }

    try {
      map.off();
      if (this.mapOwnsContainer(map, mapContainer)) {
        map.remove();
      }
    } catch {
      // Leaflet throws when the container already belongs to another map instance.
    } finally {
      this.removedMaps.add(map);
    }
  }

  private resetLeafletContainer(container: HTMLElement): void {
    const mappedContainer = container as HTMLElement & {
      _leaflet_id?: number;
    };

    if (mappedContainer._leaflet_id == null) {
      return;
    }

    container.replaceChildren();
    delete mappedContainer._leaflet_id;
  }

  createCustomIcon(
    iconUrl: string,
    iconSize: [number, number] = [32, 32],
    iconAnchor: [number, number] = [16, 16]
  ): L.Icon {
    return L.icon({
      iconUrl: iconUrl,
      iconSize: iconSize,
      iconAnchor: iconAnchor,
      popupAnchor: [0, -iconAnchor[1]],
    });
  }

  createDivIcon(html: string, className: string = ""): L.DivIcon {
    return L.divIcon({
      html: html,
      className: className,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  }
}
