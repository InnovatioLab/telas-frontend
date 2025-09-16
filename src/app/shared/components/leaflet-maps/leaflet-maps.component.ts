import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import * as L from 'leaflet';
import { MapPlottingService } from '../../services/map-plotting.service';

@Component({
  selector: 'app-leaflet-maps',
  templateUrl: './leaflet-maps.component.html',
  styleUrls: ['./leaflet-maps.component.scss']
})
export class LeafletMapsComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef;
  private map: L.Map | undefined;

  constructor(private mapPlottingService: MapPlottingService) { }

  ngAfterViewInit(): void {
    this.initMap();
  }

  private initMap(): void {
    if (this.mapContainer && !this.map) {
      this.map = L.map(this.mapContainer.nativeElement).setView([0, 0], 2); // Default view

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(this.map);

      this.mapPlottingService.setMap(this.map);
    }
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }
}
