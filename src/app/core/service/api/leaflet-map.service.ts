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
    console.log('Iniciando mapa com:', { mapContainerId, center, zoom });
    
    if (this.map) {
      console.log('Removendo mapa existente');
      this.map.remove();
    }
    
    const container = document.getElementById(mapContainerId);
    console.log('Container do mapa:', container);
    
    this.map = L.map(mapContainerId, {
      center: center,
      zoom: zoom,
      zoomControl: true,
      attributionControl: true,
      fadeAnimation: false,
      zoomAnimation: false,
      markerZoomAnimation: false
    });

    this.map.on('load', () => {
      console.log('Mapa carregado');
    });

    this.map.on('error', (error) => {
      console.error('Erro no mapa:', error);
    });

    const tileLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      minZoom: 1,
      tileSize: 256,
      updateWhenIdle: true,
      updateWhenZooming: true,
      keepBuffer: 2,
      className: 'map-tiles'
    });

    tileLayer.on('tileerror', (error) => {
      console.error('Erro ao carregar tile:', error);
    });

    tileLayer.on('tileload', (event) => {
      console.log('Tile carregado:', event);
    });

    tileLayer.addTo(this.map);
    
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
