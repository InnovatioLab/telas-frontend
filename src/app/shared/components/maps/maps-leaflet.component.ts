import { CommonModule } from "@angular/common";
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  OnChanges,
  SimpleChanges,
  Output,
  ViewChild,
} from "@angular/core";
import * as L from "leaflet";
import { MapPoint } from "@app/core/service/state/map-point.interface";

@Component({
  selector: "app-maps-leaflet",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div #mapContainer [style.width]="width" [style.height]="height" style="min-height:300px"></div>
  `,
  styles: [
    `
      :host { display:block; width:100%; height:100%; }
      :host div { width:100%; height:100%; position: relative; }
      .leaflet-container { background: #f8f9fa; }
      .leaflet-pane, .leaflet-tile, .leaflet-marker-icon { image-rendering: auto; }
      /* Prevent global img CSS from shrinking tiles */
      :host ::ng-deep .leaflet-container img.leaflet-tile { max-width: none !important; }
      /* Ensure tiles are visible */
      :host ::ng-deep .leaflet-tile { opacity: 1 !important; }
    `
  ]
})
export class MapsLeafletComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @ViewChild("mapContainer") mapContainer!: ElementRef<HTMLDivElement>;

  @Input() latitude?: number;
  @Input() longitude?: number;
  @Input() zoom = 13;
  @Input() height = "100%";
  @Input() width = "100%";
  @Input() points: MapPoint[] = [];
  @Input() center: { lat: number; lng: number } | null = null;

  @Output() pointClick = new EventEmitter<{ point: MapPoint; event: MouseEvent }>();
  @Output() markerClicked = new EventEmitter<MapPoint>();
  @Output() mapReady = new EventEmitter<boolean>();
  @Output() mapError = new EventEmitter<string>();

  private map: L.Map | null = null;
  private markers: any[] = [];
  private tileLayer: L.TileLayer | null = null;
  private tileSources: string[] = [
    // Carto Light (host único, sem {s})
    "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
  ];
  private currentTileIndex = 0;

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    try {
      const center = this.center ?? { lat: this.latitude ?? 0, lng: this.longitude ?? 0 };
      this.map = L.map(this.mapContainer.nativeElement, {
        zoomControl: true,
        attributionControl: true,
      }).setView([center.lat, center.lng], this.zoom);

      this.addTileLayerWithFallback();

      this.map.whenReady(() => {
        setTimeout(() => this.map && this.map.invalidateSize(), 50);
        setTimeout(() => this.map && this.map.invalidateSize(), 250);
      });

      // If no center provided, try browser geolocation as fallback
      if (!this.center && (this.latitude == null || this.longitude == null)) {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const lat = pos.coords.latitude;
              const lng = pos.coords.longitude;
              this.map!.setView([lat, lng], Math.max(12, this.zoom));
            },
            () => {}
          );
        }
      }

      window.addEventListener("resize", () => this.map && this.map.invalidateSize());

      // Recalculate size once the element becomes visible (handles hidden containers)
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && this.map) {
            setTimeout(() => this.map && this.map.invalidateSize(), 0);
            observer.disconnect();
          }
        });
      }, { threshold: 0.1 });
      observer.observe(this.mapContainer.nativeElement);

      this.addMapPoints(this.points);
      this.mapReady.emit(true);
    } catch (e: any) {
      this.mapError.emit(e?.message || "Error initializing map");
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["points"] && this.map) {
      this.addMapPoints(this.points);
    }
    if ((changes["center"] || changes["latitude"] || changes["longitude"]) && this.map) {
      const center = this.center ?? { lat: this.latitude ?? 0, lng: this.longitude ?? 0 };
      this.map.setView([center.lat, center.lng], this.zoom);
    }
  }

  ngOnDestroy(): void {
    this.clearMarkers();
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  public setMapPoints(points: MapPoint[]): void {
    this.points = points;
    this.addMapPoints(points);
  }

  public ensureMapInitialized(): void {
    if (!this.map) {
      this.ngAfterViewInit();
    }
  }

  private addMapPoints(points: MapPoint[]): void {
    if (!this.map) return;
    this.clearMarkers();

    points.forEach((p) => {
      if (p.latitude == null || p.longitude == null) return;
      const marker = L.marker([p.latitude, p.longitude]);
      marker.addTo(this.map!);
      marker.on("click", (event: any) => {
        this.markerClicked.emit(p);
        this.pointClick.emit({ point: p, event: event.originalEvent as MouseEvent });
      });
      this.markers.push(marker);
    });

    if (points.length > 0) {
      const latLngs = points
        .filter((p) => p.latitude != null && p.longitude != null)
        .map((p) => L.latLng(p.latitude!, p.longitude!));
      if (latLngs.length > 0) {
        this.map.fitBounds(L.latLngBounds(latLngs), { padding: [30, 30] });
      }
    }
  }

  private clearMarkers(): void {
    this.markers.forEach((m) => m.remove());
    this.markers = [];
  }

  private addTileLayerWithFallback(): void {
    if (!this.map) return;
    if (this.tileLayer) {
      this.tileLayer.remove();
      this.tileLayer = null;
    }

    const rawUrl = this.tileSources[this.currentTileIndex % this.tileSources.length];
    const finalUrl = rawUrl;
    const options: L.TileLayerOptions = {
      maxZoom: 19,
      subdomains: undefined,
      crossOrigin: true as any,
      referrerPolicy: "no-referrer" as any,
      detectRetina: true,
      updateWhenIdle: true,
      updateWhenZooming: true,
      keepBuffer: 4,
      attribution: '© OpenStreetMap © CARTO',
    };

    this.tileLayer = L.tileLayer(finalUrl, options);
    this.tileLayer.on("tileerror", () => {
      this.currentTileIndex++;
      if (this.currentTileIndex < this.tileSources.length) {
        this.addTileLayerWithFallback();
      } else {
        this.mapError.emit("Failed to load map tiles from all providers.");
      }
    });
    this.tileLayer.addTo(this.map);
    try { this.tileLayer.redraw(); } catch {}
  }
}


