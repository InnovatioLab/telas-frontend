import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { GoogleMapsService } from './google-maps.service';

export interface UserLocation {
  latitude: number;
  longitude: number;
  address?: string;
  source?: 'user' | 'search' | 'default';
}

@Injectable({
  providedIn: 'root'
})
export class UserLocationService {
  private readonly STORAGE_KEY = 'user_coordinates';
  private readonly ADDRESS_TO_GEOCODE_KEY = 'address_to_geocode';
  
  private readonly defaultLocation: UserLocation = {
    latitude: -3.7327,
    longitude: -38.5270,
    source: 'default'
  };

  private readonly locationSubject = new BehaviorSubject<UserLocation>(this.defaultLocation);

  constructor(private readonly mapsService: GoogleMapsService) {
    this.loadSavedLocation();
  }

  private loadSavedLocation(): void {
    try {
      const savedLocation = localStorage.getItem(this.STORAGE_KEY);
      if (savedLocation) {
        const location = JSON.parse(savedLocation);
        if (location && this.isValidLocation(location)) {
          this.locationSubject.next({...location, source: location.source ?? 'user'});
          console.log('Localização carregada do storage:', location);
        }
      }

      this.checkAndGeocodeAddress();
    } catch (error) {
      console.error('Erro ao carregar localização do usuário:', error);
    }
  }

  private async checkAndGeocodeAddress(): Promise<void> {
    const addressToGeocode = localStorage.getItem(this.ADDRESS_TO_GEOCODE_KEY);
    if (!addressToGeocode) return;

    try {
      console.log('Geocodificando endereço:', addressToGeocode);
      const result = await this.mapsService.searchAddress(addressToGeocode);
      
      if (result) {
        this.setUserLocation({
          latitude: result.location.latitude,
          longitude: result.location.longitude,
          address: result.formattedAddress,
          source: 'user'
        });
        
        localStorage.removeItem(this.ADDRESS_TO_GEOCODE_KEY);
        console.log('Endereço geocodificado com sucesso:', result.formattedAddress);
      }
    } catch (error) {
      console.error('Erro ao geocodificar endereço:', error);
    }
  }

  private isValidLocation(location: any): boolean {
    return (
      location &&
      typeof location.latitude === 'number' &&
      typeof location.longitude === 'number' &&
      !isNaN(location.latitude) &&
      !isNaN(location.longitude)
    );
  }

  public setUserLocation(location: UserLocation, priority: boolean = false): void {
    if (!this.isValidLocation(location)) {
      console.error('Tentativa de definir localização inválida:', location);
      return;
    }

    const currentLocation = this.locationSubject.value;
    
    if (currentLocation.source === 'user' && location.source !== 'user' && !priority) {
      console.log('Mantendo localização do usuário existente');
      return;
    }
    
    this.locationSubject.next({...location});
    this.saveLocationToStorage(location);
    console.log('Localização do usuário definida:', location);
  }

  private saveLocationToStorage(location: UserLocation): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(location));
    } catch (error) {
      console.error('Erro ao salvar localização do usuário:', error);
    }
  }

  public saveAddressToGeocode(address: string): void {
    if (!address) return;
    
    localStorage.setItem(this.ADDRESS_TO_GEOCODE_KEY, address);
    console.log('Endereço salvo para geocodificação:', address);
    
    this.checkAndGeocodeAddress();
  }

  public getUserLocation(): Observable<UserLocation> {
    return this.locationSubject.asObservable();
  }

  public getUserLocationValue(): UserLocation {
    return this.locationSubject.value;
  }
}
