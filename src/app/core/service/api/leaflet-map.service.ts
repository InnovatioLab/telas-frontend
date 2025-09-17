import { Injectable } from '@angular/core';
import * as L from 'leaflet';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LeafletMapService {
  private map: L.Map | undefined;
  private markers: L.Marker[] = [];
  private _mapInitialized = new BehaviorSubject<boolean>(false);
  public mapInitialized$: Observable<boolean> = this._mapInitialized.asObservable();

  constructor() { }

  public initMap(mapContainerId: string, center: L.LatLngExpression, zoom: number): void {
    if (this.map) {
      this.map.remove();
    }
    this.map = L.map(mapContainerId, {
      center: center,
      zoom: zoom,
      zoomControl: true,
      attributionControl: true,
      fadeAnimation: false,
      zoomAnimation: false,
      markerZoomAnimation: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      minZoom: 1,
      maxZoom: 19,
      tileSize: 256,
      crossOrigin: true,
      subdomains: ['a', 'b', 'c'],
      detectRetina: true
    }).addTo(this.map);
    
    // Força uma atualização do mapa após um breve delay
    setTimeout(() => {
      this.map?.invalidateSize();
    }, 100);

    this._mapInitialized.next(true);
  }

  public addMarker(position: L.LatLngExpression, title: string = ''): L.Marker {
    if (!this.map) {
      throw new Error('Map not initialized.');
    }
    const marker = L.marker(position).addTo(this.map).bindPopup(title);
    this.markers.push(marker);
    return marker;
  }

  public clearMarkers(): void {
    if (this.map) {
      this.markers.forEach(marker => marker.remove());
      this.markers = [];
    }
  }

  public getMap(): L.Map | undefined {
    return this.map;
  }

  public invalidateSize(): void {
    this.map?.invalidateSize();
  }
}
