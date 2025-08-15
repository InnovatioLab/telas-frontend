import { inject, Injectable, NgZone } from '@angular/core';
import * as L from 'leaflet';

@Injectable({ providedIn: 'root' })
export class PlotMapaService {

  private readonly ngZone = inject(NgZone);

  plotMarker(map: L.Map, lat: number, lng: number, title: string, clickHandler?: () => void): L.Marker | null {
    try {
      const marker = L.marker([lat, lng], {
        title: title
      }).addTo(map);

      if (clickHandler) {
        marker.on('click', () => {
          this.ngZone.run(() => {
            clickHandler();
          });
        });
      }

      return marker;
    } catch (error) {
      console.error('Erro ao plotar marker:', error);
      return null;
    }
  }

plotCircle(map: L.Map, lat: number, lng: number, options ?: L.CircleMarkerOptions): L.Circle {
  const circle = L.circle([lat, lng], options);
  circle.addTo(map);
  return circle;
}

plotCustomMarker(map: L.Map, lat: number, lng: number, svgIcon: string, popup ?: string): L.Marker {
  const icon = L.divIcon({
    html: svgIcon,
    className: 'custom-leaflet-icon',
    iconSize: [32, 32],
  });
  const marker = L.marker([lat, lng], { icon });
  if (popup) {
    marker.bindPopup(popup);
  }
  marker.addTo(map);
  return marker;
}
}
