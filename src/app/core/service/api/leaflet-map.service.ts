import { Injectable } from "@angular/core";
import * as L from "leaflet";
import { IMapService } from "@app/core/interfaces/services/map-service.interface";
import { MapPoint } from "@app/core/service/state/map-point.interface";

@Injectable({
  providedIn: "root",
})
export class LeafletMapService implements IMapService {
  private map: L.Map | null = null;
  private markers: L.Marker[] = [];
  private zoomChangeCallbacks: ((zoom: number) => void)[] = [];
  private mapClickCallbacks: ((event: any) => void)[] = [];

  async initializeMap(
    container: HTMLElement,
    center: { lat: number; lng: number },
    zoom: number
  ): Promise<L.Map> {
    const maxBounds = L.latLngBounds(
      L.latLng(-85, -180),
      L.latLng(85, 180)
    );

    this.map = L.map(container, {
      center: [center.lat, center.lng],
      zoom: zoom,
      zoomControl: true,
      minZoom: 2,
      maxZoom: 19,
      maxBounds: maxBounds,
      maxBoundsViscosity: 1.0,
      worldCopyJump: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      minZoom: 2,
      noWrap: false,
      crossOrigin: true,
      tileSize: 256,
      zoomOffset: 0,
    }).addTo(this.map);

    this.map.on("zoomend", () => {
      if (this.map) {
        const currentZoom = this.map.getZoom();
        this.zoomChangeCallbacks.forEach((callback) => callback(currentZoom));
      }
    });

    this.map.on("click", (event: L.LeafletMouseEvent) => {
      this.mapClickCallbacks.forEach((callback) => callback(event));
    });

    return this.map;
  }

  addMarker(
    point: MapPoint,
    onClick?: (point: MapPoint) => void
  ): L.Marker {
    if (!this.map) {
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

    marker.addTo(this.map);
    this.markers.push(marker);

    return marker;
  }

  removeMarker(marker: L.Marker): void {
    if (this.map) {
      this.map.removeLayer(marker);
      const index = this.markers.indexOf(marker);
      if (index > -1) {
        this.markers.splice(index, 1);
      }
    }
  }

  clearAllMarkers(): void {
    this.markers.forEach((marker) => {
      if (this.map) {
        this.map.removeLayer(marker);
      }
    });
    this.markers = [];
  }

  fitBounds(points: MapPoint[]): void {
    if (!this.map || points.length === 0) return;

    const bounds = L.latLngBounds(
      points.map((point) => [point.latitude, point.longitude])
    );

    this.map.fitBounds(bounds, {
      padding: [50, 50],
    });
  }

  setCenter(center: { lat: number; lng: number }): void {
    if (this.map) {
      this.map.setView([center.lat, center.lng], this.map.getZoom());
    }
  }

  setZoom(zoom: number): void {
    if (this.map) {
      this.map.setZoom(zoom);
    }
  }

  getZoom(): number {
    return this.map ? this.map.getZoom() : 15;
  }

  onZoomChange(callback: (zoom: number) => void): void {
    this.zoomChangeCallbacks.push(callback);
  }

  onMapClick(callback: (event: any) => void): void {
    this.mapClickCallbacks.push(callback);
  }

  getMapInstance(): L.Map | null {
    return this.map;
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

