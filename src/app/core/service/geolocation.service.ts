import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface GeolocationPosition {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

@Injectable({
  providedIn: 'root'
})
export class GeolocationService {
  private readonly defaultLocation: GeolocationPosition = {
    latitude: 30.3322, // Jacksonville, FL
    longitude: -81.6557
  };

  private currentPositionSubject = new BehaviorSubject<GeolocationPosition | null>(null);
  public currentPosition$ = this.currentPositionSubject.asObservable();

  constructor() {}

  async getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(this.defaultLocation);
        return;
      }

      const options: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userPosition: GeolocationPosition = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
          
          this.currentPositionSubject.next(userPosition);
          resolve(userPosition);
        },
        (error) => {
          this.currentPositionSubject.next(this.defaultLocation);
          resolve(this.defaultLocation);
        },
        options
      );
    });
  }

  isGeolocationAvailable(): boolean {
    return 'geolocation' in navigator;
  }

  getDefaultLocation(): GeolocationPosition {
    return this.defaultLocation;
  }

  getLastKnownPosition(): GeolocationPosition | null {
    return this.currentPositionSubject.value;
  }
}
