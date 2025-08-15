
import { AfterViewInit, Component, OnDestroy, ElementRef, ViewChild, NgZone, inject } from '@angular/core';

import * as L from 'leaflet';
import {
  MAP_DEFAULT_CENTER,
  MAP_DEFAULT_ZOOM,
  MAP_PREFER_CANVAS,
  TILE_LAYER_URL,
  TILE_LAYER_OPTIONS,
  CUSTOM_MARKER_ICON
} from './mapa.config';

@Component({
  selector: 'app-mapa',
  standalone: true,
  templateUrl: './mapa.component.html',
  styleUrls: ['./mapa.component.scss'],
})
export class MapaComponent implements AfterViewInit, OnDestroy {
  readonly ngZone = inject(NgZone);

  @ViewChild('map', { static: true }) mapContainer!: ElementRef<HTMLElement>;
  private mapInstance?: L.Map;

  ngAfterViewInit(): void {
    this.initMap();
  }

  private initMap(): void {
    this.mapContainer.nativeElement.style.height = '100%';

    if (this.mapInstance) {
      this.mapInstance.remove();
    }


    this.mapInstance = L.map(this.mapContainer.nativeElement, {
      center: MAP_DEFAULT_CENTER,
      zoom: MAP_DEFAULT_ZOOM,
      preferCanvas: MAP_PREFER_CANVAS
    });

    const tiles = L.tileLayer(TILE_LAYER_URL, TILE_LAYER_OPTIONS);
    tiles.addTo(this.mapInstance);

    (L.Marker.prototype as any).options.icon = CUSTOM_MARKER_ICON;

    setTimeout(() => {
      this.mapInstance?.invalidateSize();
    }, 0);
  }

  ngOnDestroy(): void {
    if (this.mapInstance) {
      this.mapInstance.remove();
      this.mapInstance = undefined;
    }
  }

  public getMapInstance(): L.Map | undefined {
    return this.mapInstance;
  }

  public addMarker(lat: number, lng: number, title: string, clickHandler: () => void): void {
    if (!this.mapInstance) return;

    const marker = L.marker([lat, lng], {
      title: title
    }).addTo(this.mapInstance);

    marker.on('click', () => {
      this.ngZone.run(() => {
        clickHandler();
      });
    });
  }

  public clearMarkers(): void {
  if (!this.mapInstance) return;

  this.mapInstance.eachLayer(layer => {
    if (layer instanceof L.Marker) {
      this.mapInstance?.removeLayer(layer);
    }
  });
}
}
