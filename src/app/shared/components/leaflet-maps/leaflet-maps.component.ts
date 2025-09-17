import { CommonModule } from '@angular/common';
import { Component, OnDestroy, ViewEncapsulation, inject, NgZone } from '@angular/core';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import * as L from 'leaflet';

@Component({
  selector: 'app-leaflet-maps',
  standalone: true,
  imports: [CommonModule, LeafletModule],
  templateUrl: './leaflet-maps.component.html',
  styleUrls: ['./leaflet-maps.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class LeafletMapsComponent implements OnDestroy {
  readonly ngZone = inject(NgZone);

  private mapInstance?: L.Map;

  options: L.MapOptions = {
    layers: [
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
      })
    ],
    zoom: 13,
    center: [-15.7801, -47.9292] as L.LatLngExpression
  };

  onMapReady(map: L.Map): void {
    this.mapInstance = map;
    this.addTestMarker(map);
  }

  addTestMarker(map: L.Map): void {
    const marker = L.marker([-15.7801, -47.9292], {
      icon: L.icon({
        iconUrl: '/assets/leaflet/marker-icon.png',
        iconRetinaUrl: '/assets/leaflet/marker-icon-2x.png',
        shadowUrl: '/assets/leaflet/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      })
    }).addTo(map);

    this.ngZone.run(() => {
      marker.bindPopup("<b>Olá!</b><br>Eu sou um popup.", {
        closeButton: true,
        closeOnClick: false,
        autoClose: false
      }).openPopup();
    });
  }

  ngOnDestroy(): void {
    // O ngx-leaflet gerencia o ciclo de vida do mapa, incluindo a sua destruição.
    // A chamada explícita a map.remove() aqui é a causa provável do erro
    // "Map container is being reused", pois o mapa seria destruído duas vezes.
    // Apenas limpamos a referência.
    this.mapInstance = undefined;
  }

  public getMapInstance(): L.Map | undefined {
    return this.mapInstance;
  }

  public addMarker(lat: number, lng: number, title: string, clickHandler: () => void): void {
    if (!this.mapInstance) return;

    const marker = L.marker([lat, lng], {
      title: title,
    }).addTo(this.mapInstance);

    marker.on('click', () => {
      this.ngZone.run(() => {
        clickHandler();
      });
    });
  }

  public clearMarkers(): void {
    if (!this.mapInstance) return;

    this.mapInstance.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        this.mapInstance?.removeLayer(layer);
      }
    });
  }
}