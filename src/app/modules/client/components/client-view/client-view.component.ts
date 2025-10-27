import { CommonModule } from "@angular/common";
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
} from "@angular/core";
import { RouterModule } from "@angular/router";
import { GoogleMapsService } from "@app/core/service/api/google-maps.service";
import { ZipCodeService } from "@app/core/service/api/zipcode.service";
import { Authentication } from "@app/core/service/auth/autenthication";
import { MapPoint } from "@app/core/service/state/map-point.interface";
import { ToastService } from "@app/core/service/state/toast.service";
import { GeolocationService, GeolocationPosition } from "@app/core/service/geolocation.service";
import { MapsComponent } from "@app/shared/components/maps/maps.component";
import { PopUpStepAddListComponent } from "@app/shared/components/pop-up-add-list/pop-up-add-list.component";
import { SearchSectionComponent } from "@app/shared/components/search-section/search-section.component";
import { SidebarMapaComponent } from "@app/shared/components/sidebar-mapa/sidebar-mapa.component";
import { PrimengModule } from "@app/shared/primeng/primeng.module";

@Component({
  selector: "feat-client-view",
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    PrimengModule,
    SearchSectionComponent,
    MapsComponent,
    SidebarMapaComponent,
    PopUpStepAddListComponent,
  ],
  templateUrl: "./client-view.component.html",
  styleUrls: ["./client-view.component.scss"],
})
export class ClientViewComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MapsComponent) mapsComponent!: MapsComponent;

  showPointMenu = false;
  menuPosition = { x: 0, y: 0 };
  selectedPoint: MapPoint | null = null;
  savedPoints: MapPoint[] = [];
  isLoading = false;
  mapCenter: { lat: number; lng: number } | null = null;
  mapZoom = 9;

  constructor(
    public readonly mapsService: GoogleMapsService,
    private readonly zipCodeService: ZipCodeService,
    private readonly authentication: Authentication,
    private readonly toastService: ToastService,
    private readonly cdr: ChangeDetectorRef,
    private readonly geolocationService: GeolocationService
  ) {}

  async ngOnInit(): Promise<void> {
    this.isLoading = true;

    await this.requestUserLocation();

    window.addEventListener("monitors-found", ((e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.monitors) {
        const monitors: MapPoint[] = customEvent.detail.monitors;
        this.mapsComponent.setMapPoints(monitors);
      }
    }) as EventListener);
  }

  ngAfterViewInit(): void {
    if (this.mapsComponent) {
      this.mapsComponent.ensureMapInitialized();
    }
  }

  ngOnDestroy(): void {}

  onMapInitialized(): void {
    this.isLoading = false;
    this.cdr.detectChanges();
  }

  onMapReady(): void {
    this.isLoading = false;
    this.cdr.detectChanges();
  }

  onMapError(errorMessage: string): void {
    this.isLoading = false;
    this.toastService.erro(errorMessage);
    this.cdr.detectChanges();
  }

  private ensureMapInitialized(): void {
    if (this.mapsComponent) {
      this.mapsComponent.ensureMapInitialized();
    }
  }

  private loadNearbyPoints(): void {
    this.isLoading = true;
    this.mapsService
      .getCurrentLocation()
      .then((location: { latitude: number; longitude: number } | null) => {
        if (location) {
          this.findNearbyPoints(location.latitude, location.longitude);
        } else {
          this.toastService.aviso(
            "Could not determine your location. Please search for an address."
          );
          this.isLoading = false;
        }
      })
      .catch((error: Error) => {
        this.toastService.erro(
          "Error accessing your location. Please allow location access."
        );
        this.isLoading = false;
      });
  }

  private findNearbyPoints(latitude: number, longitude: number): void {
    this.mapsService
      .findNearbyMonitors(latitude, longitude)
      .then((monitors: MapPoint[]) => {
        if (monitors && monitors.length > 0) {
          this.emitMonitorsFoundEvent(monitors);
        }
        this.isLoading = false;
      })
      .catch((error: Error) => {
        this.toastService.erro("Error searching for nearby monitors");
        this.isLoading = false;
      });
  }

  private emitMonitorsFoundEvent(monitors: MapPoint[]): void {
    const event = new CustomEvent("monitors-found", {
      detail: { monitors },
    });
    window.dispatchEvent(event);
  }

  handlePointClick(data: { point: MapPoint; event: MouseEvent }): void {
    const { point, event } = data;
    this.selectedPoint = point;

    this.menuPosition = {
      x: event.clientX,
      y: event.clientY,
    };

    this.showPointMenu = true;

    event.stopPropagation();
  }

  handleMarkerClick(point: MapPoint): void {
    this.mapsService.selectPoint(point);
  }

  showPointDetails(point: MapPoint): void {
    this.mapsService.selectPoint(point);
  }

  addPointToList(point: MapPoint): void {
    this.mapsService.addToSavedPoints(point);
  }

  onMonitorsFound(monitors: MapPoint[], zipCode?: string): void {
    if (monitors && monitors.length > 0) {
      this.mapsComponent?.setMapPoints(monitors);
      this.mapsComponent?.fitBoundsToPoints(monitors);
      this.mapsService.updateNearestMonitors(monitors);
    } else {
      this.focusOnZipCodeLocation(zipCode);
    }
  }

  private focusOnZipCodeLocation(zipCode?: string): void {
    let targetZipCode = zipCode;
    
    if (!targetZipCode) {
      const searchInput = document.getElementById('search-zipcode') as HTMLInputElement;
      targetZipCode = searchInput?.value;
    }
    
    if (targetZipCode && targetZipCode.length === 5) {
      this.mapsService.searchAddress(targetZipCode).then((result) => {
        if (result) {
          const zipCodePoint: MapPoint = {
            id: `zipcode-${targetZipCode}`,
            latitude: result.location.latitude,
            longitude: result.location.longitude,
            title: `ZIP Code ${targetZipCode}`,
            locationDescription: result.formattedAddress,
            type: 'ZIPCODE',
            category: 'ZIPCODE'
          };
          
          this.mapsComponent?.setMapPoints([zipCodePoint]);
          this.mapsComponent?.fitBoundsToPoints([zipCodePoint]);
          this.mapsService.updateNearestMonitors([zipCodePoint]);
        }
      }).catch((error) => {
        console.error('Error geocoding ZIP code:', error);
      });
    }
  }

  private async requestUserLocation(): Promise<void> {
    try {
      const position = await this.geolocationService.getCurrentPosition();
      
      this.mapCenter = { lat: position.latitude, lng: position.longitude };
      
      if (position.accuracy && position.accuracy < 100) {
        this.mapZoom = 15;
      } else if (position.accuracy && position.accuracy < 1000) {
        this.mapZoom = 12;
      } else {
        this.mapZoom = 9;
      }
      
    } catch (error) {
      this.mapCenter = { lat: 30.3322, lng: -81.6557 };
    }
  }

  private setInitialMapCenter(): void {
    const client = this.authentication._clientSignal();
    if (client?.addresses && client.addresses.length > 0) {
      const address = client.addresses[0];
      if (address.latitude && address.longitude) {
        const userLocation: MapPoint = {
          id: 'user-location',
          latitude: typeof address.latitude === 'string' ? parseFloat(address.latitude) : address.latitude,
          longitude: typeof address.longitude === 'string' ? parseFloat(address.longitude) : address.longitude,
          title: `${address.street}, ${address.city}`,
          locationDescription: `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`,
          type: 'USER_LOCATION',
          category: 'USER_LOCATION'
        };
        
        this.mapsComponent?.setMapPoints([userLocation]);
        this.mapsComponent?.fitBoundsToPoints([userLocation]);
      }
    }
  }
}
