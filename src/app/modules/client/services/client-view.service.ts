import { Injectable, signal } from '@angular/core';
import { GeolocationService } from '@app/core/service/geolocation.service';
import { GoogleMapsService } from '@app/core/service/api/google-maps.service';
import { MapPoint } from '@app/core/service/state/map-point.interface';

@Injectable({
  providedIn: 'root'
})
export class ClientViewService {
  private readonly _mapCenter = signal<{ lat: number; lng: number } | null>(null);
  private readonly _mapZoom = signal(9);
  private readonly _isLoading = signal(false);

  readonly mapCenter = this._mapCenter.asReadonly();
  readonly mapZoom = this._mapZoom.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();

  constructor(
    private readonly geolocationService: GeolocationService,
    private readonly mapsService: GoogleMapsService
  ) {}

  async initializeMap(): Promise<void> {
    this._isLoading.set(true);

    try {
      const position = await this.geolocationService.getCurrentPosition();
      
      this._mapCenter.set({ 
        lat: position.latitude, 
        lng: position.longitude 
      });
      
      if (position.accuracy && position.accuracy < 100) {
        this._mapZoom.set(15);
      } else if (position.accuracy && position.accuracy < 1000) {
        this._mapZoom.set(12);
      } else {
        this._mapZoom.set(9);
      }
    } catch (error) {
      this._mapCenter.set({ lat: 30.3322, lng: -81.6557 });
      this._mapZoom.set(9);
    } finally {
      this._isLoading.set(false);
    }
  }

  focusOnZipCodeLocation(zipCode: string): Promise<void> {
    return this.mapsService.searchAddress(zipCode).then((result) => {
      if (result) {
        const zipCodePoint: MapPoint = {
          id: `zipcode-${zipCode}`,
          latitude: result.location.latitude,
          longitude: result.location.longitude,
          title: `ZIP Code ${zipCode}`,
          locationDescription: result.formattedAddress,
          type: 'ZIPCODE',
          category: 'ZIPCODE'
        };
        
        this._mapCenter.set({
          lat: result.location.latitude,
          lng: result.location.longitude
        });
        this._mapZoom.set(15);
        
        this.mapsService.updateNearestMonitors([zipCodePoint]);
      }
    }).catch((error) => {
    });
  }

  updateMapCenter(center: { lat: number; lng: number }, zoom?: number): void {
    this._mapCenter.set(center);
    if (zoom !== undefined) {
      this._mapZoom.set(zoom);
    }
  }
}

