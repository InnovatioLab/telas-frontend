import { Injectable, NgZone } from '@angular/core';
import { MapPoint } from '../state/map-point.interface';
import * as L from 'leaflet';
import 'leaflet.markercluster';
import { Subject } from 'rxjs';

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
  private readonly monitorsSubject = new Subject<MapPoint[]>();
  public monitorsFound$ = this.monitorsSubject.asObservable();

  private readonly TILE_LAYER_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  private readonly TILE_LAYER_OPTIONS: L.TileLayerOptions = {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  };
  private readonly DEFAULT_CENTER: L.LatLngExpression = [34.0522, -118.2437];
  private readonly DEFAULT_ZOOM = 12;

  constructor(private readonly ngZone: NgZone) { }

  public getTileLayerUrl(): string { return this.TILE_LAYER_URL; }
  public getTileLayerOptions(): L.TileLayerOptions { return this.TILE_LAYER_OPTIONS; }
  public getDefaultCenter(): L.LatLngExpression { return this.DEFAULT_CENTER; }
  public getDefaultZoom(): number { return this.DEFAULT_ZOOM; }
  public plotNewMonitors(monitors: MapPoint[]): void {
    this.monitorsSubject.next(monitors);
  }
  public panTo(center: L.LatLngExpression): void {
    if (this.map) {
      this.map.panTo(center);
    }
  }

  private createSvgMarkerIcon(size: number | string = 24, color: string = 'currentColor'): L.DivIcon {
    const svgHtml = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}">
        <path
          d="M20 3H4C2.9 3 2 3.9 2 5V17C2 18.1 2.9 19 4 19H8V21H16V19H20C21.1 19 22 18.1 22 17V5C22 3.9 21.1 3 20 3ZM20 17H4V5H20V17Z"
        />
        <path d="M6 7H18V15H6V7Z" />
      </svg>
    `;
    return L.divIcon({
      html: svgHtml,
      className: 'custom-svg-icon', // Add a class for potential styling
      iconSize: [Number(size), Number(size)], // Adjust size based on SVG
      iconAnchor: [Number(size) / 2, Number(size)], // Anchor to the bottom center
      popupAnchor: [0, -Number(size)] // Popup above the icon
    });
  }

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
        icon: this.createSvgMarkerIcon(30, '#007bff') // Using a default size and color
      });
      marker.on('click', () => {
        this.ngZone.run(() => {
          markerClickHandler(markerData.data);
        });
      });
      this.markersClusterGroup.addLayer(marker);
    });

    if (markers.length > 0) {
      const latLngs = markers.map(marker => L.latLng(marker.position as L.LatLngTuple));
      const bounds = L.latLngBounds(latLngs);
      this.map.fitBounds(bounds, { padding: [50, 50] });
    }
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