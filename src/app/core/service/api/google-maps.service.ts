import { Inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ENVIRONMENT } from 'src/environments/environment-token';
import { Environment } from 'src/environments/environment.interface';
import { MapPoint } from '../state/map-point.interface';
import { LoadingService } from '../state/loading.service';

export interface AddressSearchResult {
  location: MapPoint;
  formattedAddress: string;
  timestamp?: Date;
  query?: string;
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
  
  constructor(
    @Inject(ENVIRONMENT) private readonly env: Environment,
    private readonly loadingService: LoadingService
  ) {
    window.addEventListener('address-to-geocode', ((e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.address) {
        this.checkAndGeocodeStoredAddress();
      }
    }) as EventListener);
  }

  public initGoogleMapsApi(): void {
    // Verificar se a API já está carregada e funcionando
    if (typeof google !== 'undefined' && google.maps && google.maps.Map) {
      console.log('Google Maps API already loaded');
      this.apiLoadedSubject.next(true);
      this.apiErrorSubject.next(null);
      this.apiInitializationAttempts = 0;
      this.apiLoadingInProgress = false;
      return;
    }
    
    if (this.apiLoadingInProgress) {
      console.log('Google Maps API loading already in progress');
      return;
    }
    
    if ((window as any)[this.callbackName]) {
      console.log('Google Maps callback already exists');
      return;
    }
    
    this.apiLoadingInProgress = true;
    this.apiInitializationAttempts++;
    console.log('Inicializando carregamento da API do Google Maps, tentativa', this.apiInitializationAttempts);
    
    const timeoutCheck = setTimeout(() => {
      if (!this.apiLoadedSubject.getValue() && this.apiInitializationAttempts < this.MAX_INITIALIZATION_ATTEMPTS) {
        console.log('Timeout reached, retrying...');
        this.removeExistingScripts();
        this.apiLoadingInProgress = false;
          this.initGoogleMapsApi();
      } else if (this.apiInitializationAttempts >= this.MAX_INITIALIZATION_ATTEMPTS) {
        console.error('Max initialization attempts reached');
        this.apiErrorSubject.next('Não foi possível carregar o Google Maps. Tente novamente mais tarde.');
        this.apiLoadingInProgress = false;
      }
    }, 10000);
    
    (window as any)[this.callbackName] = () => {
      clearTimeout(timeoutCheck);
      console.log('Google Maps API loaded successfully');
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
      console.error('Error loading Google Maps script:', error);
      this.apiErrorSubject.next('Erro ao carregar o Google Maps. Tentando novamente...');
      this.apiLoadingInProgress = false;
      if (this.apiInitializationAttempts < this.MAX_INITIALIZATION_ATTEMPTS) {
        setTimeout(() => this.initGoogleMapsApi(), 2000);
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
      fillColor: '#4285F4', // Cor azul do Google
      fillOpacity: 1,
      strokeWeight: 2,
      strokeColor: '#FFFFFF',
      scale: 10
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
      console.error('Erro ao carregar coordenadas salvas:', error);
    }
  }
  
  public selectPoint(point: MapPoint | null): void {
    this.selectedPointSubject.next(point);
  }
  
  public async checkAndGeocodeStoredAddress(): Promise<void> {
    const addressToGeocode = localStorage.getItem('address_to_geocode');
    if (!addressToGeocode) return;
    
    try {
      console.log('Geocodificando endereço armazenado:', addressToGeocode);
      
      if (!this.apiLoadedSubject.value) {
        console.log('API do Google Maps ainda não está carregada. Aguardando...');
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
        
        console.log('Endereço geocodificado com sucesso:', result.formattedAddress);
      }
    } catch (error) {
      console.error('Erro ao geocodificar endereço armazenado:', error);
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
      console.error('Error searching for address:', error);
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
      console.error('Erro ao carregar histórico de buscas:', error);
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
        console.error('Erro ao carregar pontos salvos:', e);
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
      console.error('API do Google Maps não está disponível');
      return null;
    }
    
    const geocoder = new google.maps.Geocoder();
    
    try {
      const result = await new Promise<google.maps.GeocoderResult | null>((resolve, reject) => {
        geocoder.geocode({ address: address.trim() }, (results, status) => {
          if (status === google.maps.GeocoderStatus.OK && results && results.length > 0) {
            resolve(results[0]);
          } else {
            console.error('Falha na geocodificação:', status);
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
      console.error('Erro ao buscar endereço:', error);
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
      setTimeout(() => {
        try {
          const points: MapPoint[] = [];
          
          const numPoints = 1;
          for (let i = 0; i < numPoints; i++) {
            const adjustedCoords = this.adjustCoordinates(latitude, longitude, i);
            
            points.push({
              id: `monitor-${i}`,
              latitude: adjustedCoords.latitude,
              longitude: adjustedCoords.longitude,
              title: `Monitor ${i + 1}`,
              description: `Monitor located at the specified address`,
              type: 'MONITOR',
              category: 'MONITOR',
              data: {
                id: `id-${i}`,
                active: true,
                type: i === 0 ? 'BASIC' : 'PREMIUM',
                size: i === 0 ? 40 : 55,
                distanceInKm: 0,
                latitude: adjustedCoords.latitude,
                longitude: adjustedCoords.longitude
              }
            });
          }
          
          this.updateNearestMonitors(points);
          this.searchingSubject.next(false);
          resolve(points);
        } catch (error) {
          this.searchingSubject.next(false);
          this.searchErrorSubject.next('Error processing nearby points');
          reject(error);
        }
      }, 1000);
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
    // Verificar se a API está realmente funcionando
    if (typeof google === 'undefined' || !google.maps || !google.maps.Map) {
      console.log('Google Maps API not properly loaded, reinitializing...');
      this.apiLoadedSubject.next(false);
      this.apiErrorSubject.next(null);
      this.apiInitializationAttempts = 0;
      this.apiLoadingInProgress = false;
      this.initGoogleMapsApi();
    } else {
      console.log('Google Maps API is properly loaded');
      this.apiLoadedSubject.next(true);
      this.apiErrorSubject.next(null);
    }
  }
}
