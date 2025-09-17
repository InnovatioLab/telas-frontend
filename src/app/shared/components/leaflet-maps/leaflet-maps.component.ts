import { CommonModule } from '@angular/common';
import { Component, OnDestroy, ViewEncapsulation, inject, NgZone, OnChanges, EventEmitter, Input, Output, SimpleChanges, OnInit } from '@angular/core';
import { LeafletMapService, MapMarker } from '@app/core/service/state/leaflet-map.service';
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
export class LeafletMapsComponent implements OnChanges, OnDestroy, OnInit {
  readonly ngZone = inject(NgZone);
  private readonly leafletMapService = inject(LeafletMapService);

  private mapInstance?: L.Map;
  private readonly markersLayer = L.layerGroup();

  @Input() center!: L.LatLngExpression;
  @Input() zoom!: number;
  @Input() markers: MapMarker[] = [];
  @Input() markerIcon!: L.Icon;

  @Output() mapReady = new EventEmitter<L.Map>();
  @Output() markerClick = new EventEmitter<MapMarker>();

  options!: L.MapOptions;

  ngOnInit(): void {
    this.center = this.center ?? this.leafletMapService.getDefaultCenter();
    this.zoom = this.zoom ?? this.leafletMapService.getDefaultZoom();
    this.markerIcon = this.markerIcon ?? this.leafletMapService.getCustomMarkerIcon();

    this.options = {
      layers: [
        L.tileLayer(
          this.leafletMapService.getTileLayerUrl(),
          this.leafletMapService.getTileLayerOptions()
        ),
        this.markersLayer
      ],
    };
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.mapInstance) return;

    if (changes['markers']) {
      this.updateMarkers();
    }
    if (changes['center']) {
      this.mapInstance.panTo(this.center);
    }
    if (changes['zoom']) {
      this.mapInstance.setZoom(this.zoom);
    }
  }

  onMapReady(map: L.Map): void {
    this.mapInstance = map;
    this.mapInstance.setView(this.center, this.zoom);
    this.updateMarkers();
    this.mapReady.emit(map);
  }

  private updateMarkers(): void {
    if (!this.mapInstance) return;
    this.markersLayer.clearLayers();

    this.markers.forEach(markerData => {
      const marker = L.marker(markerData.position, {
        title: markerData.title,
        icon: this.markerIcon
      });

      marker.on('click', () => {
        this.ngZone.run(() => {
          this.markerClick.emit(markerData);
        });
      });

      this.markersLayer.addLayer(marker);
    });
  }

  ngOnDestroy(): void {
    this.mapInstance?.remove();
    this.mapInstance = undefined;
  }
}