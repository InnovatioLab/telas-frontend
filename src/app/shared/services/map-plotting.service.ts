import { Injectable } from '@angular/core';
import * as L from 'leaflet';

@Injectable({
  providedIn: 'root'
})
export class MapPlottingService {
  private map: L.Map | undefined;

  constructor() { }

  setMap(map: L.Map): void {
    this.map = map;
  }

  plotMarker(lat: number, lng: number, popupText?: string): L.Marker | undefined {
    if (this.map) {
      const marker = L.marker([lat, lng]).addTo(this.map);
      if (popupText) {
        marker.bindPopup(popupText).openPopup();
      }
      return marker;
    }
    return undefined;
  }

  plotCircle(lat: number, lng: number, radius: number, options?: L.CircleMarkerOptions): L.Circle | undefined {
    if (this.map) {
      const circle = L.circle([lat, lng], { radius, ...options }).addTo(this.map);
      return circle;
    }
    return undefined;
  }

  plotPolygon(latlngs: L.LatLngExpression[], options?: L.PolylineOptions): L.Polygon | undefined {
    if (this.map) {
      const polygon = L.polygon(latlngs, options).addTo(this.map);
      return polygon;
    }
    return undefined;
  }

  clearLayers(): void {
    if (this.map) {
      this.map.eachLayer((layer) => {
        if (layer instanceof L.Marker || layer instanceof L.Circle || layer instanceof L.Polygon) {
          this.map?.removeLayer(layer);
        }
      });
    }
  }

  fitBounds(latlngs: L.LatLngExpression[]): void {
    if (this.map && latlngs.length > 0) {
      const bounds = L.latLngBounds(latlngs);
      this.map.fitBounds(bounds);
    }
  }
}
