import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  zipCode?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GeocodingService {
  private readonly apiKey = environment.googleMapsApiKey;

  constructor(private http: HttpClient) {}

  geocodeAddress(address: string): Observable<GeocodingResult | null> {
    if (!address || !this.apiKey) {
      return of(null);
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${this.apiKey}`;
    
    return this.http.get<any>(url).pipe(
      map(response => this.extractCoordinates(response)),
      catchError(() => of(null))
    );
  }

  geocodeZipCode(zipCode: string): Observable<GeocodingResult | null> {
    return this.geocodeAddress(zipCode);
  }

  reverseGeocode(latitude: number, longitude: number): Observable<GeocodingResult | null> {
    if (!this.apiKey) {
      return of(null);
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${this.apiKey}`;
    
    return this.http.get<any>(url).pipe(
      map(response => this.extractCoordinates(response)),
      catchError(() => of(null))
    );
  }

  private extractCoordinates(response: any): GeocodingResult | null {
    if (response.results && response.results.length > 0) {
      const result = response.results[0];
      const location = result.geometry.location;
      
      return {
        latitude: location.lat,
        longitude: location.lng,
        formattedAddress: result.formatted_address,
        zipCode: this.extractZipCode(result.address_components)
      };
    }
    return null;
  }

  private extractZipCode(addressComponents: any[]): string | undefined {
    const zipCodeComponent = addressComponents.find(component => 
      component.types.includes('postal_code')
    );
    return zipCodeComponent?.long_name;
  }
}
