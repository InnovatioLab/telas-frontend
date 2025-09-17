import { Injectable, NgZone } from '@angular/core';
import { MapPoint } from '../state/map-point.interface';
import * as L from 'leaflet';
import 'leaflet.markercluster';

export interface MapMarker {
  position: L.LatLngExpression;
  title: string;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class LeafletMapService {
  private map?: L.Map;
  private readonly markersClusterGroup = L.markerClusterGroup();

  private readonly TILE_LAYER_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  private readonly TILE_LAYER_OPTIONS: L.TileLayerOptions = {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  };
  private readonly CUSTOM_MARKER_ICON = L.icon({
    iconUrl: '/assets/img/marker-custom.png',
    iconSize: [39.286, 58.83],
    iconAnchor: [19.643, 58.83],
    popupAnchor: [0, -58.83]
  });
  private readonly DEFAULT_CENTER: L.LatLngExpression = [34.0522, -118.2437];
  private readonly DEFAULT_ZOOM = 12;

  constructor(private readonly ngZone: NgZone) { }

  public getTileLayerUrl(): string { return this.TILE_LAYER_URL; }
  public getTileLayerOptions(): L.TileLayerOptions { return this.TILE_LAYER_OPTIONS; }
  public getCustomMarkerIcon(): L.Icon { return this.CUSTOM_MARKER_ICON; }
  public getDefaultCenter(): L.LatLngExpression { return this.DEFAULT_CENTER; }
  public getDefaultZoom(): number { return this.DEFAULT_ZOOM; }

  public initializeMap(
    containerId: string,
    center: L.LatLngExpression,
    zoom: number
  ): void {
    if (this.map) {
      this.map.remove();
    }
    this.map = L.map(containerId).setView(center, zoom);
    L.tileLayer(this.TILE_LAYER_URL, this.TILE_LAYER_OPTIONS).addTo(this.map);
    this.map.addLayer(this.markersClusterGroup);
  }

  public plotMarkers(markers: MapMarker[], markerClickHandler: (point: any) => void): void {
    if (!this.map) return;
    this.clearMarkers();
    markers.forEach(markerData => {
      const marker = L.marker(markerData.position, {
        title: markerData.title,
        icon: this.CUSTOM_MARKER_ICON
      });
      marker.on('click', () => {
        this.ngZone.run(() => {
          markerClickHandler(markerData.data);
        });
      });
      this.markersClusterGroup.addLayer(marker);
    });
  }

  public clearMarkers(): void {
    this.markersClusterGroup.clearLayers();
  }

  public destroyMap(): void {
    if (this.map) {
      this.map.remove();
      this.map = undefined;
    }
  }

  public findNearbyMonitors(latitude: number, longitude: number): Promise<MapPoint[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const points: MapPoint[] = [];
        const numPoints = 15;
        for (let i = 0; i < numPoints; i++) {
          const adjustedCoords = this.adjustCoordinates(latitude, longitude, i);
          points.push({
            id: `monitor-${i}`,
            latitude: adjustedCoords.latitude,
            longitude: adjustedCoords.longitude,
            title: `Monitor ${i + 1}`,
            type: "MONITOR",
          });
        }
        resolve(points);
      }, 500);
    });
  }

  private adjustCoordinates(
    latitude: number,
    longitude: number,
    index: number
  ): { latitude: number; longitude: number } {
    const offset = (Math.random() - 0.5) * 0.05;
    const offsetLng = (Math.random() - 0.5) * 0.05;
    return {
      latitude: latitude + offset,
      longitude: longitude + offsetLng,
    };
  }
}