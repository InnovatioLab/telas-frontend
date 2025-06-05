import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ENVIRONMENT } from 'src/environments/environment-token';
import { Environment } from 'src/environments/environment';
import { MapPoint } from '../state/map-point.interface';

export interface MonitorMinResponseDto {
  id: string;
  active: boolean;
  type: string;
  size: number;
  distanceInKm: number;
  latitude: number;
  longitude: number;
}

export interface NearestMonitorsResponse {
  [zipCode: string]: MonitorMinResponseDto[];
}

export interface ApiResponseDto<T> {
  data: T;
  status: number;
  message: string;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class SearchMonitorsService {
  private readonly nearestMonitorsSubject = new BehaviorSubject<MapPoint[]>([]);
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  private readonly errorSubject = new BehaviorSubject<string | null>(null);
  private readonly storageName = 'raizes_ce_token';

  constructor(
    private readonly http: HttpClient,
    @Inject(ENVIRONMENT) private readonly env: Environment
  ) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem(this.storageName);
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  public findNearestMonitors(
    zipCode: string,
    size?: number,
    type?: string,
    limit: number = 3
  ): Observable<NearestMonitorsResponse> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    let params = new HttpParams()
      .set('zipCodes', zipCode)
      .set('limit', limit.toString());

    if (size) {
      params = params.set('size', size.toString());
    }

    if (type) {
      params = params.set('type', type);
    }

    const url = `${this.env.apiUrl}monitors/nearest`;
    const headers = this.getAuthHeaders();

    return this.http.get<ApiResponseDto<NearestMonitorsResponse>>(url, { 
      params,
      headers
    }).pipe(
      map(response => {
        const allPoints: MapPoint[] = [];
        
        if (Array.isArray(response.data)) {
          try {
            const coordPairs = response.data[0];
            if (Array.isArray(coordPairs) && coordPairs.length >= 2) {
              coordPairs.forEach((pair, index) => {
                if (Array.isArray(pair) && pair.length === 2) {
                  const point: MapPoint = {
                    id: `monitor-${index}`,
                    latitude: pair[0],
                    longitude: pair[1],
                    title: `Monitor #${index + 1}`,
                    description: `Location: ${pair[0].toFixed(6)}, ${pair[1].toFixed(6)}`,
                    type: 'MONITOR',
                    category: 'MONITOR'
                  };
                  allPoints.push(point);
                }
              });
            }
          } catch (error) {
            console.error('Error processing coordinates:', error);
          }
        } else if (typeof response.data === 'object') {
          Object.keys(response.data).forEach(zipCode => {
            const monitors = response.data[zipCode];
            const points = this.convertMonitorsToMapPoints(monitors);
            allPoints.push(...points);
          });
        }
        
        this.nearestMonitorsSubject.next(allPoints);
        this.loadingSubject.next(false);
        
        if (allPoints.length === 0) {
          const zipCodes = Object.keys(response.data || {}).join(', ');
          const errorMsg = `No monitors found for ZIP code ${zipCodes || zipCode}`;
          this.errorSubject.next(errorMsg);
        }
        
        return response.data;
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        const errorMsg = error.error?.message ?? 'Error searching for nearby monitors';
        this.errorSubject.next(errorMsg);
        throw error;
      })
    );
  }

  private convertMonitorsToMapPoints(monitors: MonitorMinResponseDto[]): MapPoint[] {
    return monitors.map(monitor => ({
      id: monitor.id,
      title: `Monitor ${monitor.type} - ${monitor.size}"`,
      description: `Distance: ${monitor.distanceInKm.toFixed(2)} km`,
      latitude: monitor.latitude,
      longitude: monitor.longitude,
      type: monitor.type,
      category: 'MONITOR',
      data: monitor
    }));
  }

  public findByZipCode(zipCode: string): Promise<MapPoint[]> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);
    
    if (!zipCode || zipCode.trim().length < 5) {
      this.errorSubject.next('Invalid zip code');
      this.loadingSubject.next(false);
      return Promise.resolve([]);
    }

    const cleanZipCode = zipCode.replace(/\D/g, '');
    
    return this.findNearestMonitors(cleanZipCode)
      .toPromise()
      .then(() => {
        const points = this.nearestMonitorsSubject.getValue();
        if (points.length === 0) {
          this.errorSubject.next(`No monitors found for ZIP code ${cleanZipCode}`);
        }
        return points;
      })
      .catch((error): MapPoint[] => {
        console.error('Error searching by zip code:', error);
        this.errorSubject.next('Error searching monitors by zip code');
        return [];
      })
      .finally(() => {
        this.loadingSubject.next(false);
      });
  }

  public async searchNearestMonitorsByAddress(
    address: string,
    googleMapsService: any,
    size?: number,
    type?: string,
    limit: number = 3
  ): Promise<MapPoint[]> {
    const zipRegex = /^\d{5}(-\d{4})?$/;
    if (zipRegex.test(address)) {
      return this.findByZipCode(address);
    }
    
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    try {
      const geocodeResult = await googleMapsService.searchAddress(address);
      
      if (!geocodeResult) {
        throw new Error('Address not found');
      }
      
      const zipCode = this.extractZipCodeFromAddress(geocodeResult.formattedAddress);
      
      if (!zipCode) {
        throw new Error('Unable to identify zip code from address');
      }
      
      const response = await this.findNearestMonitors(zipCode, size, type, limit).toPromise();
      
      const currentPoints = this.nearestMonitorsSubject.getValue();
      return currentPoints;
    } catch (error: any) {
      const errorMessage = error?.message || 'Error searching for nearby monitors';
      this.errorSubject.next(errorMessage);
      return [];
    } finally {
      this.loadingSubject.next(false);
    }
  }

  private extractZipCodeFromAddress(address: string): string | null {
    const brRegex = /\b\d{5}-\d{3}\b/;
    const usRegex = /\b\d{5}(?:-\d{4})?\b/;
    
    const brMatch = address.match(brRegex);
    if (brMatch) {
      return brMatch[0].replace('-', '');
    }
    
    const usMatch = address.match(usRegex);
    if (usMatch) {
      return usMatch[0].replace('-', '');
    }
    
    return null;
  }

  public get nearestMonitors$(): Observable<MapPoint[]> {
    return this.nearestMonitorsSubject.asObservable();
  }
  
  public get isLoading$(): Observable<boolean> {
    return this.loadingSubject.asObservable();
  }
  
  public get error$(): Observable<string | null> {
    return this.errorSubject.asObservable();
  }
}
