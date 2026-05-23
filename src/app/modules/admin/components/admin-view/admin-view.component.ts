import { CommonModule } from "@angular/common";
import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Subscription } from "rxjs";
import * as L from "leaflet";
import { GoogleMapsService } from "../../../../core/service/api/google-maps.service";
import { ZipCodeService } from "../../../../core/service/api/zipcode.service";
import { Authentication } from "../../../../core/service/auth/autenthication";
import { GeolocationService } from "../../../../core/service/geolocation.service";
import { LoadingService } from "../../../../core/service/state/loading.service";
import { MapPoint } from "../../../../core/service/state/map-point.interface";
import { MapsComponent } from "../../../../shared/components/maps/maps.component";
import { SearchSectionComponent } from "../../../../shared/components/search-section/search-section.component";
import { SidebarMapaComponent } from "../../../../shared/components/sidebar-mapa/sidebar-mapa.component";
import { MapViewportFacadeService } from "../../../client/services/map-viewport-facade.service";

@Component({
  selector: "app-admin-view",
  standalone: true,
  providers: [MapViewportFacadeService],
  imports: [
    CommonModule,
    FormsModule,
    SearchSectionComponent,
    MapsComponent,
    SidebarMapaComponent,
  ],
  templateUrl: "./admin-view.component.html",
  styleUrls: ["./admin-view.component.scss"],
})
export class AdminViewComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild("mapsComponent") mapsComponent!: MapsComponent;

  monitors: MapPoint[] = [];
  mapCenter: { lat: number; lng: number } | null = null;
  private map: L.Map | null = null;
  private readonly subscriptions: Subscription[] = [];

  constructor(
    private readonly googleMapsService: GoogleMapsService,
    private readonly zipCodeService: ZipCodeService,
    private readonly authentication: Authentication,
    private readonly loadingService: LoadingService,
    private readonly geolocationService: GeolocationService,
    private readonly viewportFacade: MapViewportFacadeService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.requestUserLocation();
    this.setupEventListeners();
  }

  ngAfterViewInit(): void {
    this.viewportFacade.connect({
      getMapsComponent: () => this.mapsComponent,
      googleMapsService: this.googleMapsService,
      ensureMapInitialized: () => this.mapsComponent?.ensureMapInitialized(),
      onMarkersChanged: (points) => {
        this.monitors = points;
      },
    });
    setTimeout(() => {
      if (this.mapsComponent && !this.mapsComponent.isMapReady()) {
        this.mapsComponent.forceReinitialize();
      }
    }, 2000);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  private setupEventListeners(): void {
    const userCoordsSub = this.googleMapsService.savedPoints$.subscribe(
      (points) => {
        if (points.length > 0) {
          const lastPoint = points[points.length - 1];
          this.mapCenter = {
            lat: lastPoint.latitude,
            lng: lastPoint.longitude,
          };
        }
      }
    );

    this.subscriptions.push(userCoordsSub);
  }

  private loadNearbyPoints(): void {
    if (!this.mapCenter) return;

    this.loadingService.setLoading(true, "load-nearby-points");

    this.googleMapsService
      .findNearbyMonitors(this.mapCenter.lat, this.mapCenter.lng)
      .then((monitors) => {
        this.monitors = monitors;
        this.loadingService.setLoading(false, "load-nearby-points");
      })
      .catch((error) => {
        this.loadingService.setLoading(false, "load-nearby-points");
      });
  }

  onMapLeafletInitialized(leafletMap: L.Map): void {
    this.map = leafletMap;
    this.viewportFacade.onMapLeafletInitialized(leafletMap);
  }

  onMapReady(leafletMap: L.Map): void {
    this.viewportFacade.onMapReady(leafletMap);
  }

  onMarkerClick(point: MapPoint): void {
    this.googleMapsService.selectPoint(point);

    if (this.map) {
      this.map.setView([point.latitude, point.longitude], 16);
    }
  }

  onMonitorClick(monitor: MapPoint): void {
    this.onMarkerClick(monitor);
  }

  private checkMapInitialization(): void {
    if (!this.mapsComponent?.isMapReady()) {
      this.mapsComponent?.forceReinitialize();
    }
  }

  onMonitorsFound(monitors: MapPoint[], zipCode?: string): void {
    if (monitors && monitors.length > 0) {
      this.viewportFacade.onZipSearchWithResults(monitors, true);
    } else {
      this.viewportFacade.onZipSearchEmpty();
      void this.viewportFacade.focusOnZipCodeLocation(zipCode).then((center) => {
        if (center) {
          this.mapCenter = center;
        }
      });
    }
  }

  private async requestUserLocation(): Promise<void> {
    try {
      const position = await this.geolocationService.getCurrentPosition();

      if (position.latitude !== 30.3322 || position.longitude !== -81.6557) {
        this.mapCenter = { lat: position.latitude, lng: position.longitude };
      } else {
        this.mapCenter = { lat: 30.3322, lng: -81.6557 };
      }
    } catch (error) {
      this.mapCenter = { lat: 30.3322, lng: -81.6557 };
    }
  }

  private setUserLocationCenter(): void {
    const client = this.authentication._clientSignal();
    if (client?.addresses && client.addresses.length > 0) {
      const address = client.addresses[0];
      if (address.latitude && address.longitude) {
        const lat = typeof address.latitude === "string" ? parseFloat(address.latitude) : address.latitude;
        const lng = typeof address.longitude === "string" ? parseFloat(address.longitude) : address.longitude;
        
        // Apenas centralizar o mapa na localização do usuário, sem criar marcador
        const center = { lat, lng };
        
        // Se houver monitors, ajustar o zoom para mostrar todos
        if (this.monitors.length > 0) {
          this.mapsComponent?.setMapCenter(center);
          this.mapsComponent?.fitBoundsToPoints(this.monitors);
        } else {
          // Se não houver monitors, apenas centralizar com zoom padrão
          this.mapsComponent?.setMapCenter(center);
        }
      }
    }
  }
}
