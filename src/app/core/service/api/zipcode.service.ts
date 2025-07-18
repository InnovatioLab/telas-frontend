import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { ENVIRONMENT } from 'src/environments/environment-token';
import { LocalAddressResponse } from '@app/model/dto/response/local-address-response';
import { ZipCodeResponse } from '@app/model/dto/response/zipcode-response';
import { AddressData } from '@app/model/dto/request/address-data-request';
import { MapPoint } from '@app/core/service/state/map-point.interface';



@Injectable({
  providedIn: 'root'
})
export class ZipCodeService {
  private readonly baseUrl = 'https://app.zipcodebase.com/api/v1';
  private readonly env = inject(ENVIRONMENT);
  private readonly apiKeyBackup = '9bdde870-2bf6-11f0-92e4-ab00f677d113';
  private readonly localApiUrl = this.env.apiUrl || '';
  
  private readonly zipCodeMap: Record<string, {lat: number, lng: number, city: string, state: string}> = {
    '90210': {lat: 34.0901, lng: -118.4065, city: 'Beverly Hills', state: 'CA'},
    '10001': {lat: 40.7501, lng: -73.9964, city: 'New York', state: 'NY'},
    '60601': {lat: 41.8855, lng: -87.6212, city: 'Chicago', state: 'IL'},
    '02108': {lat: 42.3582, lng: -71.0637, city: 'Boston', state: 'MA'},
    '33101': {lat: 25.7751, lng: -80.1947, city: 'Miami', state: 'FL'},
    '94102': {lat: 37.7795, lng: -122.4193, city: 'San Francisco', state: 'CA'},
    '98101': {lat: 47.6062, lng: -122.3321, city: 'Seattle', state: 'WA'},
    '89101': {lat: 36.1699, lng: -115.1398, city: 'Las Vegas', state: 'NV'},
    '77001': {lat: 29.7604, lng: -95.3698, city: 'Houston', state: 'TX'},
    '32789': {lat: 28.5972, lng: -81.3542, city: 'Winter Park', state: 'FL'},
  };
  
  private readonly lastLocationSubject = new BehaviorSubject<{
    addressData: AddressData | null,
    mapPoint: MapPoint | null
  }>({ addressData: null, mapPoint: null });

  constructor(private readonly http: HttpClient) {}

  public get lastLocation$(): Observable<{
    addressData: AddressData | null,
    mapPoint: MapPoint | null
  }> {
    return this.lastLocationSubject.asObservable();
  }

  public findLocationByZipCode(zipCode: string): Observable<AddressData | null> {
    if (!zipCode) {
      return of(null);
    }
    
    if (this.zipCodeMap[zipCode]) {
      const staticData = this.zipCodeMap[zipCode];
      const result: AddressData = {
        zipCode: zipCode,
        city: staticData.city,
        state: staticData.state,
        country: 'US',
        latitude: staticData.lat.toString(),
        longitude: staticData.lng.toString(),
      };
      
      this.processAndEmitLocation(result);
      
      return of(result);
    }
    
    return this.findLocationInLocalApi(zipCode).pipe(
      map(localResult => {
        if (localResult && this.isAddressValid(localResult)) {
          return localResult;
        }
        return null;
      }),
      switchMap(localResult => {
        if (localResult) {
          return of(localResult); 
        }
        return this.findLocationInExternalApi(zipCode);
      }),
      tap(result => {
        if (result) {
          this.processAndEmitLocation(result);
        }
      }),
      catchError(error => {
        const result = this.generateMockZipCodeData(zipCode);
        this.processAndEmitLocation(result);
        return of(result);
      })
    );
  }

  private processAndEmitLocation(result: AddressData): void {
    if (!result) return;
    
    let mapPoint: MapPoint | null = null;
    
    if (result.latitude && result.longitude) {
      const lat = parseFloat(result.latitude);
      const lng = parseFloat(result.longitude);
      
      if (!isNaN(lat) && !isNaN(lng)) {
        mapPoint = {
          latitude: lat,
          longitude: lng,
          title: `${result.city || ''}, ${result.state || ''} ${result.zipCode}`,
          description: `${result.street || ''} ${result.city || ''}, ${result.state || ''} ${result.zipCode}`,
          id: `zipcode-${result.zipCode}`,
          type: 'ADDRESS',
          category: 'ADDRESS'
        };
      }
    }
    
    this.lastLocationSubject.next({
      addressData: result,
      mapPoint
    });
    
    if (mapPoint) {
      this.emitLocationFoundEvent(mapPoint);
      
      localStorage.setItem('user_coordinates', JSON.stringify({
        latitude: mapPoint.latitude,
        longitude: mapPoint.longitude,
        address: mapPoint.title,
        source: 'zipcode-search'
      }));
      
      const coordsEvent = new CustomEvent('user-coordinates-updated', {
        detail: {
          latitude: mapPoint.latitude,
          longitude: mapPoint.longitude
        }
      });
      window.dispatchEvent(coordsEvent);
    }
  }
  
  private generateMockZipCodeData(zipCode: string): AddressData {
    const firstDigit = parseInt(zipCode.charAt(0), 10);
    
    let state = 'CA';
    let city = 'Unknown City';
    let lat = 37.0902;
    let lng = -95.7129;
    
    if (firstDigit === 0) { 
      state = 'MA'; city = 'Boston'; lat = 42.3601; lng = -71.0589; 
    } else if (firstDigit === 1) { 
      state = 'NY'; city = 'New York'; lat = 40.7128; lng = -74.0060; 
    } else if (firstDigit === 2) { 
      state = 'VA'; city = 'Richmond'; lat = 37.5407; lng = -77.4360; 
    } else if (firstDigit === 3) { 
      state = 'FL'; city = 'Miami'; lat = 25.7617; lng = -80.1918; 
    } else if (firstDigit === 4) { 
      state = 'MI'; city = 'Detroit'; lat = 42.3314; lng = -83.0458; 
    } else if (firstDigit === 5) { 
      state = 'IL'; city = 'Chicago'; lat = 41.8781; lng = -87.6298; 
    } else if (firstDigit === 6) { 
      state = 'MO'; city = 'Kansas City'; lat = 39.0997; lng = -94.5786; 
    } else if (firstDigit === 7) { 
      state = 'TX'; city = 'Dallas'; lat = 32.7767; lng = -96.7970; 
    } else if (firstDigit === 8) { 
      state = 'CO'; city = 'Denver'; lat = 39.7392; lng = -104.9903; 
    } else if (firstDigit === 9) { 
      state = 'CA'; city = 'Los Angeles'; lat = 34.0522; lng = -118.2437; 
    }
    
    const lastTwoDigits = parseInt(zipCode.slice(-2), 10) || 0;
    const latVariation = (lastTwoDigits % 10) * 0.01;
    const lngVariation = (lastTwoDigits % 10) * 0.01;
    
    return {
      zipCode: zipCode,
      city: city,
      state: state,
      country: 'US',
      latitude: (lat + latVariation).toString(),
      longitude: (lng + lngVariation).toString()
    };
  }
  
  private emitLocationFoundEvent(location: MapPoint): void {
    const event = new CustomEvent('zipcode-location-found', {
      detail: { location }
    });
    window.dispatchEvent(event);
  }

  private isAddressValid(address: AddressData): boolean {
    return !!address.city && !!address.state && !!address.country;
  }

  private findLocationInLocalApi(zipCode: string): Observable<AddressData | null> {
    const url = `${this.localApiUrl}addresses/${zipCode}`;
    
    return this.http.get<LocalAddressResponse>(url).pipe(
      map(response => {
        if (response?.zipCode) {
          return {
            zipCode: response.zipCode,
            street: response.street || '',
            city: response.city || '',
            state: response.state || '',
            country: response.country || '',
            latitude: null as string | null,
            longitude: null as string | null
          };
        }
        return null;
      }),
      catchError(() => of(null))
    );
  }

  findLocationInExternalApi(zipCode: string): Observable<AddressData | null> {
    const apiKey = this.env.zipCodeApiKey || this.apiKeyBackup;
    
    const useMockData = true;
    const useProxy = false;
    
    if (useMockData) {
      if (this.zipCodeMap[zipCode]) {
        const staticData = this.zipCodeMap[zipCode];
        const result: AddressData = {
          zipCode: zipCode,
          city: staticData.city,
          state: staticData.state,
          country: 'US',
          latitude: staticData.lat.toString(),
          longitude: staticData.lng.toString(),
        };
        return of(result);
      }
      
      const mockData = this.generateMockZipCodeData(zipCode);
      return of(mockData);
    }
    
    if (useProxy) {
      const url = `https://api.zippopotam.us/us/${zipCode}`;
      
      return this.http.get<any>(url).pipe(
        map(response => {
          const location: AddressData = {
            street: response.places?.[0]?.['place name'] || '',
            city: response.places?.[0]?.['place name'] || '',
            state: response.places?.[0]?.['state abbreviation'] || '',
            country: response.country || 'US',
            zipCode: response['post code'] || zipCode,
            latitude: response.places?.[0]?.['latitude'] || '0',
            longitude: response.places?.[0]?.['longitude'] || '0'
          };
          
          return location;
        }),
        catchError(error => {
          const mockData = this.generateMockZipCodeData(zipCode);
          return of(mockData);
        })
      );
    }
    
    const mockData = this.generateMockZipCodeData(zipCode);
    return of(mockData);
  }

  public getStatesList(): Observable<{ code: string; name: string }[]> {
    const usStates = [
      { code: 'AL', name: 'Alabama' },
      { code: 'AK', name: 'Alaska' },
      { code: 'AZ', name: 'Arizona' },
      { code: 'AR', name: 'Arkansas' },
      { code: 'CA', name: 'California' },
      { code: 'CO', name: 'Colorado' },
      { code: 'CT', name: 'Connecticut' },
      { code: 'DE', name: 'Delaware' },
      { code: 'FL', name: 'Florida' },
      { code: 'GA', name: 'Georgia' },
      { code: 'HI', name: 'Hawaii' },
      { code: 'ID', name: 'Idaho' },
      { code: 'IL', name: 'Illinois' },
      { code: 'IN', name: 'Indiana' },
      { code: 'IA', name: 'Iowa' },
      { code: 'KS', name: 'Kansas' },
      { code: 'KY', name: 'Kentucky' },
      { code: 'LA', name: 'Louisiana' },
      { code: 'ME', name: 'Maine' },
      { code: 'MD', name: 'Maryland' },
      { code: 'MA', name: 'Massachusetts' },
      { code: 'MI', name: 'Michigan' },
      { code: 'MN', name: 'Minnesota' },
      { code: 'MS', name: 'Mississippi' },
      { code: 'MO', name: 'Missouri' },
      { code: 'MT', name: 'Montana' },
      { code: 'NE', name: 'Nebraska' },
      { code: 'NV', name: 'Nevada' },
      { code: 'NH', name: 'New Hampshire' },
      { code: 'NJ', name: 'New Jersey' },
      { code: 'NM', name: 'New Mexico' },
      { code: 'NY', name: 'New York' },
      { code: 'NC', name: 'North Carolina' },
      { code: 'ND', name: 'North Dakota' },
      { code: 'OH', name: 'Ohio' },
      { code: 'OK', name: 'Oklahoma' },
      { code: 'OR', name: 'Oregon' },
      { code: 'PA', name: 'Pennsylvania' },
      { code: 'RI', name: 'Rhode Island' },
      { code: 'SC', name: 'South Carolina' },
      { code: 'SD', name: 'South Dakota' },
      { code: 'TN', name: 'Tennessee' },
      { code: 'TX', name: 'Texas' },
      { code: 'UT', name: 'Utah' },
      { code: 'VT', name: 'Vermont' },
      { code: 'VA', name: 'Virginia' },
      { code: 'WA', name: 'Washington' },
      { code: 'WV', name: 'West Virginia' },
      { code: 'WI', name: 'Wisconsin' },
      { code: 'WY', name: 'Wyoming' }
    ];
    
    return of(usStates);
  }
}
