import { Injectable, signal } from '@angular/core';
import { GeolocationService } from '@app/core/service/geolocation.service';

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

  constructor(private readonly geolocationService: GeolocationService) {}

  async initializeMap(): Promise<void> {
    this._isLoading.set(true);

    try {
      const fallback = {
        lat: this.geolocationService.getDefaultLocation().latitude,
        lng: this.geolocationService.getDefaultLocation().longitude,
      };
      this._mapCenter.set(fallback);
      this._mapZoom.set(9);
    } finally {
      this._isLoading.set(false);
    }
  }

  updateMapCenter(center: { lat: number; lng: number }, zoom?: number): void {
    this._mapCenter.set(center);
    if (zoom !== undefined) {
      this._mapZoom.set(zoom);
    }
  }
}

