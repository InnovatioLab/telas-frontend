import { Inject, Injectable } from '@angular/core';
import { Monitor } from '@app/model/monitors';
import { BehaviorSubject, Observable } from 'rxjs';
import { ENVIRONMENT } from 'src/environments/environment-token';
import { Environment } from 'src/environments/environment.interface';
import { LoadingService } from '../state/loading.service';
import { MapPoint } from '../state/map-point.interface';
import { MonitorService } from './monitor.service';

export interface AddressSearchResult {
  location: MapPoint;
  formattedAddress: string;
  timestamp?: Date;
  query?: string;
}

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  placeId: string;
  addressComponents: google.maps.GeocoderAddressComponent[];
}

@Injectable({
  providedIn: 'root'
})
export class GoogleMapsService {
  private readonly apiLoadedSubject = new BehaviorSubject<boolean>(false);
  private readonly apiErrorSubject = new BehaviorSubject<string | null>(null);
  private readonly selectedPointSubject = new BehaviorSubject<MapPoint | null>(null);
  private readonly searchingSubject = new BehaviorSubject<boolean>(false);
  private readonly searchErrorSubject = new BehaviorSubject<string | null>(null);
  private readonly searchResultSubject = new BehaviorSubject<AddressSearchResult | null>(null);
  private readonly searchHistorySubject = new BehaviorSubject<AddressSearchResult[]>([]);
  private readonly _savedPoints = new BehaviorSubject<MapPoint[]>([]);
  private readonly nearestMonitorsSubject = new BehaviorSubject<MapPoint[]>([]);
  
  private readonly callbackName = 'googleMapsInitialized';
  private readonly MAX_HISTORY_ITEMS = 10;
  private apiInitializationAttempts = 0;
  private readonly MAX_INITIALIZATION_ATTEMPTS = 5;
  private apiLoadingInProgress = false;
  private apiLoadingPromise: Promise<void> | null = null;
  private apiCallback: (() => void) | null = null;
  
  constructor(
    @Inject(ENVIRONMENT) private readonly env: Environment,
    private readonly loadingService: LoadingService,
    private readonly monitorService: MonitorService
  ) {
    window.addEventListener('address-to-geocode', ((e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.address) {
        this.checkAndGeocodeStoredAddress();
      }
    }) as EventListener);
  }

  public initGoogleMapsApi(forceLoad: boolean = false): void {
    if (typeof google !== 'undefined' && google.maps?.Map) {
      this.apiLoadedSubject.next(true);
      this.apiErrorSubject.next(null);
      this.apiInitializationAttempts = 0;
      this.apiLoadingInProgress = false;
      return;
    }
    
    if (!forceLoad && !this.shouldLoadGoogleMaps()) {
      return;
    }
    
    if (this.apiLoadingInProgress) {
      return;
    }
    
    if ((window as any)[this.callbackName]) {
      return;
    }
    
    this.apiLoadingInProgress = true;
    this.apiInitializationAttempts++;
    
    const timeoutCheck = setTimeout(() => {
      if (!this.apiLoadedSubject.getValue() && this.apiInitializationAttempts < this.MAX_INITIALIZATION_ATTEMPTS) {
        this.removeExistingScripts();
        this.apiLoadingInProgress = false;
        this.initGoogleMapsApi(forceLoad);
      } else if (this.apiInitializationAttempts >= this.MAX_INITIALIZATION_ATTEMPTS) {
        this.apiErrorSubject.next('Não foi possível carregar o Google Maps. Tente novamente mais tarde.');
        this.apiLoadingInProgress = false;
      }
    }, 10000);
    
    (window as any)[this.callbackName] = () => {
      clearTimeout(timeoutCheck);
      this.apiLoadedSubject.next(true);
      this.apiErrorSubject.next(null);
      this.apiLoadingInProgress = false;
      this.apiInitializationAttempts = 0;
    };
    
    const script = document.createElement('script');
    const apiKey = this.env.googleMapsApiKey;
    
    if (!apiKey) {
      this.apiErrorSubject.next('API Key do Google Maps não configurada.');
      this.apiLoadingInProgress = false;
      return;
    }
    
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=${this.callbackName}&v=weekly`;
    script.async = true;
    script.defer = true;
    script.id = 'google-maps-script';
    
    script.onerror = (error) => {
      clearTimeout(timeoutCheck);
      this.apiErrorSubject.next('Erro ao carregar o Google Maps. Tentando novamente...');
      this.apiLoadingInProgress = false;
      if (this.apiInitializationAttempts < this.MAX_INITIALIZATION_ATTEMPTS) {
        setTimeout(() => this.initGoogleMapsApi(forceLoad), 2000);
      }
    };
    
    document.head.appendChild(script);
  }
  
  private removeExistingScripts(): void {
    const existingScript = document.getElementById('google-maps-script');
    if (existingScript) {
      existingScript.remove();
    }
    
    if ((window as any)[this.callbackName]) {
      delete (window as any)[this.callbackName];
    }
  }
  
  public get apiLoaded$(): Observable<boolean> {
    return this.apiLoadedSubject.asObservable();
  }
  
  public get apiError$(): Observable<string | null> {
    return this.apiErrorSubject.asObservable();
  }
  
  public get isSearching$(): Observable<boolean> {
    return this.searchingSubject.asObservable();
  }
  
  public get searchError$(): Observable<string | null> {
    return this.searchErrorSubject.asObservable();
  }
  
  public get searchResult$(): Observable<AddressSearchResult | null> {
    return this.searchResultSubject.asObservable();
  }
  
  public get searchHistory$(): Observable<AddressSearchResult[]> {
    return this.searchHistorySubject.asObservable();
  }
  
  public get selectedPoint$(): Observable<MapPoint | null> {
    return this.selectedPointSubject.asObservable();
  }
  
  public get savedPoints$(): Observable<MapPoint[]> {
    return this._savedPoints.asObservable();
  }
  
  public get nearestMonitors$(): Observable<MapPoint[]> {
    return this.nearestMonitorsSubject.asObservable();
  }
  
  public convertToMarkerPositions(points: MapPoint[]): google.maps.LatLngLiteral[] {
    return points.map(point => ({
      lat: point.latitude,
      lng: point.longitude
    }));
  }
  
  public createMarkerOptions(point: MapPoint): google.maps.marker.AdvancedMarkerElementOptions {
    const options: google.maps.marker.AdvancedMarkerElementOptions = {
      gmpDraggable: false,
      title: point.title || ''
    };
    
    if (point.icon) {
      (options as any).glyph = point.icon;
    }
    
    return options;
  }
  
  public createRedMarkerIcon(): google.maps.Symbol {
    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: '#FF0000',
      fillOpacity: 1,
      strokeWeight: 1,
      strokeColor: '#FFFFFF',
      scale: 8
    };
  }
  
  public createSearchMarkerIcon(): google.maps.Symbol {
    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: '#4285F4',
      fillOpacity: 1,
      strokeWeight: 2,
      strokeColor: '#FFFFFF',
      scale: 10
    };
  }
  
  public createMonitorIcon(hasAvailableSlots?: boolean): google.maps.Symbol {
    let fillColor: string;
    
    console.log(`[GoogleMapsService] Criando ícone monitor com hasAvailableSlots: ${hasAvailableSlots}`);
    
    if (hasAvailableSlots === true) {
      fillColor = '#28a745'; // --cor-sucesso (verde)
      console.log('[GoogleMapsService] Usando cor VERDE (disponível)');
    } else if (hasAvailableSlots === false) {
      fillColor = '#6c757d'; // --cor-cinza
      console.log('[GoogleMapsService] Usando cor CINZA (indisponível)');
    } else {
      fillColor = '#232F3E'; // --cor-primaria (padrão)
      console.log('[GoogleMapsService] Usando cor PADRÃO (indefinido)');
    }
    
    return {
      path: 'M20 3H4C2.9 3 2 3.9 2 5V17C2 18.1 2.9 19 4 19H8V21H16V19H20C21.1 19 22 18.1 22 17V5C22 3.9 21.1 3 20 3ZM20 17H4V5H20V17ZM6 7H18V15H6V7Z',
      fillColor: fillColor,
      fillOpacity: 1,
      strokeWeight: 2,
      strokeColor: '#FFFFFF',
      scale: 1.8
    };
  }
  
  public createMonitorIconWithColor(color: string): google.maps.Symbol {
    return {
      path: 'M20 3H4C2.9 3 2 3.9 2 5V17C2 18.1 2.9 19 4 19H8V21H16V19H20C21.1 19 22 18.1 22 17V5C22 3.9 21.1 3 20 3ZM20 17H4V5H20V17ZM6 7H18V15H6V7Z',
      fillColor: color,
      fillOpacity: 1,
      strokeWeight: 2,
      strokeColor: '#FFFFFF',
      scale: 1.8
    };
  }
  
  public loadPointsFromSavedLocation(): void {
    try {
      const savedCoordinates = localStorage.getItem('user_coordinates');
      if (savedCoordinates) {
        const coordinates = JSON.parse(savedCoordinates);
        if (coordinates?.latitude && coordinates?.longitude) {
          const event = new CustomEvent('user-coordinates-updated', {
            detail: {
              latitude: coordinates.latitude,
              longitude: coordinates.longitude
            }
          });
          window.dispatchEvent(event);
        }
      }
    } catch (error) {
      // Handle storage errors silently
    }
  }
  
  public selectPoint(point: MapPoint | null): void {
    this.selectedPointSubject.next(point);
  }
  
  public async checkAndGeocodeStoredAddress(): Promise<void> {
    const addressToGeocode = localStorage.getItem('address_to_geocode');
    if (!addressToGeocode) return;
    
    try {
      if (!this.apiLoadedSubject.value) {
        await new Promise<void>(resolve => {
          const subscription = this.apiLoaded$.subscribe(loaded => {
            if (loaded) {
              subscription.unsubscribe();
              resolve();
            }
          });
        });
      }
      
      const result = await this.searchAddress(addressToGeocode);
      if (result) {
        localStorage.setItem('user_coordinates', JSON.stringify({
          latitude: result.location.latitude,
          longitude: result.location.longitude,
          address: result.formattedAddress,
          source: 'user'
        }));
        
        localStorage.removeItem('address_to_geocode');
        
        this.searchResultSubject.next({
          location: result.location,
          formattedAddress: result.formattedAddress
        });
        
        const event = new CustomEvent('user-coordinates-updated', { 
          detail: { 
            latitude: result.location.latitude,
            longitude: result.location.longitude
          }
        });
        window.dispatchEvent(event);
      }
    } catch (error) {
      // Handle geocoding errors silently
    }
  }
  
  public async performAddressSearch(query: string): Promise<void> {
    if (!query?.trim()) {
      this.searchErrorSubject.next('Please enter an address to search');
      return;
    }
    
    this.searchingSubject.next(true);
    this.searchErrorSubject.next(null);
    
    try {
      const result = await this.searchAddress(query);
      
      if (!result) {
        this.searchErrorSubject.next('Address not found');
        this.searchingSubject.next(false);
        return;
      }
      
      const searchResult: AddressSearchResult = {
        ...result,
        timestamp: new Date(),
        query
      };
      
      this.searchResultSubject.next(searchResult);
      this.addToSearchHistory(searchResult);
      this.selectPoint(result.location);
      
      localStorage.setItem('user_coordinates', JSON.stringify({
        latitude: result.location.latitude,
        longitude: result.location.longitude,
        address: result.formattedAddress,
        source: 'user'
      }));
      
    } catch (error) {
      this.searchErrorSubject.next('Error searching for address');
    } finally {
      this.searchingSubject.next(false);
    }
  }
  
  private addToSearchHistory(result: AddressSearchResult): void {
    const currentHistory = this.searchHistorySubject.getValue();
    const newHistory = [result, ...currentHistory].slice(0, this.MAX_HISTORY_ITEMS);
    this.searchHistorySubject.next(newHistory);
    localStorage.setItem('addressSearchHistory', JSON.stringify(newHistory));
  }
  
  public loadSearchHistoryFromLocalStorage(): void {
    try {
      const savedHistory = localStorage.getItem('addressSearchHistory');
      if (savedHistory) {
        const history: AddressSearchResult[] = JSON.parse(savedHistory);
        this.searchHistorySubject.next(history);
      }
    } catch (error) {
      // Handle storage errors silently
    }
  }
  
  public addToSavedPoints(point: MapPoint): void {
    if (!point) return;
    
    const currentPoints = this._savedPoints.getValue();
    if (!currentPoints.some(p => p.id === point.id)) {
      const newPoints = [...currentPoints, point];
      this._savedPoints.next(newPoints);
      localStorage.setItem('savedMapPoints', JSON.stringify(newPoints));
    }
  }
  
  public getSavedPoints(): MapPoint[] {
    return this._savedPoints.getValue();
  }
  
  public initSavedPoints(): void {
    const savedItems = localStorage.getItem('savedMapPoints');
    if (savedItems) {
      try {
        const points = JSON.parse(savedItems);
        this._savedPoints.next(points);
      } catch (e) {
        // Handle storage errors silently
      }
    }
  }
  
  public updateNearestMonitors(monitors: MapPoint[]): void {
    this.nearestMonitorsSubject.next(monitors);
  }
  
  public getNearestMonitors(): MapPoint[] {
    return this.nearestMonitorsSubject.getValue();
  }
  
  public async searchAddress(address: string): Promise<{ 
    location: MapPoint, 
    formattedAddress: string 
  } | null> {
    if (!address?.trim()) {
      return null;
    }
    
    if (typeof google === 'undefined' || !google.maps) {
      return null;
    }
    
    const geocoder = new google.maps.Geocoder();
    
    try {
      const result = await new Promise<google.maps.GeocoderResult | null>((resolve, reject) => {
        geocoder.geocode({ address: address.trim() }, (results, status) => {
          if (status === google.maps.GeocoderStatus.OK && results && results.length > 0) {
            resolve(results[0]);
          } else {
            resolve(null);
          }
        });
      });
      
      if (!result) {
        return null;
      }
      
      const location = {
        latitude: result.geometry.location.lat(),
        longitude: result.geometry.location.lng(),
        title: result.formatted_address
      };
      
      return {
        location,
        formattedAddress: result.formatted_address
      };
    } catch (error) {
      return null;
    }
  }
  
  public getCurrentLocation(): Promise<{latitude: number, longitude: number} | null> {
    return new Promise((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const coordinates = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            };
            
            localStorage.setItem('user_coordinates', JSON.stringify(coordinates));
            
            resolve(coordinates);
          },
          () => {
            const savedCoordinates = this.getUserCoordinates();
            if (savedCoordinates) {
              resolve(savedCoordinates);
            } else {
              resolve(null);
            }
          }
        );
      } else {
        resolve(this.getUserCoordinates() || null);
      }
    });
  }
  
  private getUserCoordinates(): { latitude: number, longitude: number } | null {
    try {
      const savedData = localStorage.getItem('user_coordinates');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (parsed?.latitude && parsed?.longitude) {
          return {
            latitude: parsed.latitude,
            longitude: parsed.longitude
          };
        }
      }
    } catch (e) {
      console.error('Erro ao ler coordenadas salvas:', e);
    }
    return null;
  }
  
  findNearbyMonitors(latitude: number, longitude: number): Promise<MapPoint[]> {
    this.searchingSubject.next(true);
    
    return new Promise((resolve, reject) => {
      // Usar o MonitorService para buscar monitores reais
      this.monitorService.getMonitors().subscribe({
        next: (monitors: Monitor[]) => {
          try {
            console.log('[GoogleMapsService] Monitors recebidos do service:', monitors);
            
            const mapPoints: MapPoint[] = monitors
              .filter((monitor: Monitor) => monitor.latitude && monitor.longitude) // Filtrar apenas monitores com coordenadas
              .map((monitor: Monitor) => {
                console.log(`[GoogleMapsService] Processando monitor ${monitor.id}:`, {
                  hasAvailableSlots: monitor.hasAvailableSlots,
                  latitude: monitor.latitude,
                  longitude: monitor.longitude
                });
                
                const lat = typeof monitor.latitude === 'string' ? parseFloat(monitor.latitude) : monitor.latitude;
                const lng = typeof monitor.longitude === 'string' ? parseFloat(monitor.longitude) : monitor.longitude;
                
                return {
                  id: monitor.id,
                  latitude: lat,
                  longitude: lng,
                  position: { lat, lng },
                  title: monitor.name ?? `Monitor ${monitor.id}`,
                  description: monitor.locationDescription ?? monitor.address?.coordinatesParams ?? 'Monitor location',
                  type: 'MONITOR',
                  category: 'MONITOR',
                  hasAvailableSlots: monitor.hasAvailableSlots,
                  data: monitor
                };
              });
            
            console.log('[GoogleMapsService] MapPoints criados:', mapPoints);
            this.updateNearestMonitors(mapPoints);
            this.searchingSubject.next(false);
            resolve(mapPoints);
          } catch (error) {
            this.searchingSubject.next(false);
            this.searchErrorSubject.next('Error processing nearby points');
            reject(new Error('Error processing nearby points'));
          }
        },
        error: (error: any) => {
          this.searchingSubject.next(false);
          this.searchErrorSubject.next('Error loading monitors from API');
          reject(new Error('Error loading monitors from API'));
        }
      });
    });
  }
  
  private adjustCoordinates(latitude: number, longitude: number, index: number): { latitude: number, longitude: number } {
    const offset = 0.001;
    return {
      latitude: latitude + (offset * index),
      longitude: longitude + (offset * index)
    };
  }

  public updateSavedPoints(points: MapPoint[]): void {
    this._savedPoints.next(points);
    localStorage.setItem('savedMapPoints', JSON.stringify(points));
  }

  public clearCurrentSearch(): void {
    this.searchErrorSubject.next(null);
    this.searchResultSubject.next(null);
  }

  public setSearchResult(result: AddressSearchResult): void {
    this.searchResultSubject.next(result);
    this.addToSearchHistory(result);
  }

  public checkAndReinitializeApi(): void {
    if (!this.apiLoadedSubject.value) {
      this.initGoogleMapsApi(true);
    }
  }

  loadGoogleMapsAPI(): Promise<void> {
    if (this.apiLoadedSubject.value) {
      return Promise.resolve();
    }

    if (this.apiLoadingPromise) {
      return this.apiLoadingPromise;
    }

    if (this.apiCallback) {
      return Promise.resolve();
    }

    this.apiInitializationAttempts++;
    
    this.apiLoadingPromise = new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.apiLoadingPromise = null;
        reject(new Error('Google Maps API loading timeout'));
      }, 10000);

      this.apiCallback = () => {
        clearTimeout(timeout);
        this.apiLoadedSubject.next(true);
        this.apiErrorSubject.next(null);
        this.apiLoadingPromise = null;
        resolve();
      };

      const script = document.createElement('script');
      const apiKey = this.env.googleMapsApiKey;
      
      if (!apiKey) {
        this.apiErrorSubject.next('API Key do Google Maps não configurada.');
        this.apiLoadingInProgress = false;
        reject(new Error('API Key do Google Maps não configurada.'));
        return;
      }
      
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=${this.callbackName}&v=weekly`;
      script.async = true;
      script.defer = true;
      script.id = 'google-maps-script';
      
      script.onerror = (error) => {
        clearTimeout(timeout);
        this.apiLoadingPromise = null;
        this.apiErrorSubject.next('Erro ao carregar o Google Maps. Tentando novamente...');
        if (this.apiInitializationAttempts < this.MAX_INITIALIZATION_ATTEMPTS) {
          setTimeout(() => this.initGoogleMapsApi(true), 2000);
        }
        reject(error);
      };
      
      (window as any).initGoogleMaps = this.apiCallback;
      document.head.appendChild(script);
    });

    return this.apiLoadingPromise;
  }

  private async waitForApiAndGeocode(addressToGeocode: string): Promise<void> {
    if (!this.apiLoadedSubject.value) {
      await this.loadGoogleMapsAPI();
    }
  }

  async geocodeAddress(addressToGeocode: string): Promise<GeocodingResult> {
    await this.waitForApiAndGeocode(addressToGeocode);

    return new Promise((resolve, reject) => {
      const geocoder = new google.maps.Geocoder();
      
      geocoder.geocode({ address: addressToGeocode }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results && results.length > 0) {
          const result = results[0];
          const location = result.geometry.location;
          
          const geocodingResult: GeocodingResult = {
            latitude: location.lat(),
            longitude: location.lng(),
            formattedAddress: result.formatted_address,
            placeId: result.place_id,
            addressComponents: result.address_components
          };
          
          resolve(geocodingResult);
        } else {
          reject(new Error(`Geocoding failed: ${status}`));
        }
      });
    });
  }

  checkApiStatus(): boolean {
    if (!this.apiLoadedSubject.value) {
      this.initGoogleMapsApi(true);
      return false;
    }
    return true;
  }

  private shouldLoadGoogleMaps(): boolean {
    const currentUrl = window.location.pathname;
    const allowedRoutes = ['/client', '/admin'];
    
    return allowedRoutes.some(route => {
      const exactRoutePattern = new RegExp(`^${route}(\\/)?$`);
      return exactRoutePattern.test(currentUrl);
    });
  }
}
