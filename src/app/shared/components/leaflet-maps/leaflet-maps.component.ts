import { CommonModule } from '@angular/common';
import { Component, OnDestroy, ViewEncapsulation, inject, NgZone, OnChanges, EventEmitter, Input, Output, SimpleChanges, OnInit } from '@angular/core';
import { LeafletMapService, MapMarker } from '@app/core/service/state/leaflet-map.service';
import { MapPoint } from '@app/core/service/state/map-point.interface';
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

  @Output() mapReady = new EventEmitter<L.Map>();
  @Output() markerClick = new EventEmitter<MapMarker>();

  options!: L.MapOptions;

  ngOnInit(): void {
    this.center = this.center ?? this.leafletMapService.getDefaultCenter();
    this.zoom = this.zoom ?? this.leafletMapService.getDefaultZoom();

    this.options = {
      layers: [
        L.tileLayer(
          this.leafletMapService.getTileLayerUrl(),
          this.leafletMapService.getTileLayerOptions()
        ),
        this.markersLayer
      ],
    };

    // Listen for custom event to update markers
    window.addEventListener('monitors-found', this.handleMonitorsFoundEvent.bind(this) as EventListener);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.mapInstance) return;

    if (changes['markers']) {
      this.leafletMapService.plotMarkers(this.markers, (point) => this.markerClick.emit(point));
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
    this.leafletMapService.initializeMap(map.getContainer().id, this.center, this.zoom); // Initialize map in service
    this.leafletMapService.plotMarkers(this.markers, (point) => this.markerClick.emit(point)); // Plot markers using service
    this.mapReady.emit(map);
  }

  private handleMonitorsFoundEvent(event: CustomEvent): void {
    console.log('LeafletMapsComponent: Received monitors-found event with detail:', event.detail);
    const monitors: MapPoint[] = event.detail.monitors;
    this.markers = monitors.map(point => ({
      position: [point.latitude, point.longitude],
      title: point.title,
      data: point
    }));
    this.leafletMapService.plotMarkers(this.markers, (point) => this.markerClick.emit(point)); // Plot markers using service

    // Optionally, adjust map view to fit all markers
    if (this.mapInstance && this.markers.length > 0) {
      const latLngs = this.markers.map(marker => L.latLng(marker.position as L.LatLngTuple));
      const bounds = L.latLngBounds(latLngs);
      this.mapInstance.fitBounds(bounds, { padding: [50, 50] });
    }
  }

  ngOnDestroy(): void {
    this.mapInstance?.remove();
    this.mapInstance = undefined;
    window.removeEventListener('monitors-found', this.handleMonitorsFoundEvent.bind(this) as EventListener);
  }
}