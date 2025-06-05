import { Inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ENVIRONMENT } from 'src/environments/environment-token';
import { Environment } from 'src/environments/environment.interface';
import { MapPoint } from '../state/map-point.interface';

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
  readonly savedPoints$ = this._savedPoints.asObservable();
  readonly nearestMonitors$ = this.nearestMonitorsSubject.asObservable();
  
  private readonly callbackName = 'googleMapsInitialized';
  private readonly MAX_HISTORY_ITEMS = 10;

  constructor(
    @Inject(ENVIRONMENT) private readonly env: Environment
  ) {
    window.addEventListener('address-to-geocode', ((e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.address) {
        this.checkAndGeocodeStoredAddress();
      }
    }) as EventListener);
  }

  public initGoogleMapsApi(): void {
    if (typeof google !== 'undefined' && google.maps) {
      this.apiLoadedSubject.next(true);
      return;
    }

    if ((window as any)[this.callbackName]) {
      return;
    }

    console.log('Inicializando carregamento da API do Google Maps');
    
    (window as any)[this.callbackName] = () => {
      console.log('Google Maps API carregada com sucesso via callback');
      this.apiLoadedSubject.next(true);
      this.apiErrorSubject.next(null);
      this.loadPointsFromSavedLocation();
    };

    const script = document.createElement('script');
    const apiKey = this.env.googleMapsApiKey;
    
    if (!apiKey) {
      const error = 'Chave da API do Google Maps não encontrada';
      this.apiErrorSubject.next(error);
      console.error(error);
      return;
    }

    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=${this.callbackName}&v=weekly`;
    script.async = true;
    script.defer = true;
    
    script.onerror = (error) => {
      const errorMessage = 'Erro ao carregar a API do Google Maps';
      this.apiErrorSubject.next(errorMessage);
      console.error(errorMessage, error);
    };
    
    document.head.appendChild(script);
    
    setTimeout(() => {
      if (!this.apiLoadedSubject.value) {
        const timeoutMessage = 'Timeout ao carregar a API do Google Maps';
        this.apiErrorSubject.next(timeoutMessage);
        console.error(timeoutMessage);
      }
    }, 10000);
  }

  public get apiLoaded$(): Observable<boolean> {
    return this.apiLoadedSubject.asObservable();
  }

  public get apiError$(): Observable<string | null> {
    return this.apiErrorSubject.asObservable();
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
      options.content = point.icon;
    }

    return options;
  }

  public createRedMarkerIcon(): google.maps.Icon {
    return {
      url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
      scaledSize: new google.maps.Size(32, 32),
      origin: new google.maps.Point(0, 0),
      anchor: new google.maps.Point(16, 32)
    };
  }

  private loadPointsFromSavedLocation(): void {
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

  public get selectedPoint$(): Observable<MapPoint | null> {
    return this.selectedPointSubject.asObservable();
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
  
  public clearCurrentSearch(): void {
    this.searchErrorSubject.next(null);
    this.searchResultSubject.next(null);
  }
  
  private addToSearchHistory(result: AddressSearchResult): void {
    const currentHistory = this.searchHistorySubject.value;
    
    const existingIndex = currentHistory.findIndex(item => 
      item.query.toLowerCase() === result.query.toLowerCase()
    );
    
    let newHistory: AddressSearchResult[];
    
    if (existingIndex >= 0) {
      newHistory = [...currentHistory];
      newHistory[existingIndex] = result;
    } else {
      newHistory = [result, ...currentHistory];
      
      if (newHistory.length > this.MAX_HISTORY_ITEMS) {
        newHistory = newHistory.slice(0, this.MAX_HISTORY_ITEMS);
      }
    }
    
    this.searchHistorySubject.next(newHistory);
    this.saveSearchHistoryToLocalStorage();
  }
  
  private saveSearchHistoryToLocalStorage(): void {
    try {
      localStorage.setItem('addressSearchHistory', 
        JSON.stringify(this.searchHistorySubject.value)
      );
    } catch (error) {
      console.error('Erro ao salvar histórico de buscas:', error);
    }
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
  
  public clearSearchHistory(): void {
    this.searchHistorySubject.next([]);
    localStorage.removeItem('addressSearchHistory');
  }
  
  addToSavedPoints(point: MapPoint): void {
    if (!point) return;
    
    const currentPoints = this._savedPoints.getValue();
    if (!currentPoints.some(p => p.id === point.id)) {
      const newPoints = [...currentPoints, point];
      this._savedPoints.next(newPoints);
      localStorage.setItem('savedMapPoints', JSON.stringify(newPoints));
    }
  }
  
  updateSavedPoints(points: MapPoint[]): void {
    this._savedPoints.next(points);
  }
  
  removeFromSavedPoints(pointId: string): void {
    const currentPoints = this._savedPoints.getValue();
    const newPoints = currentPoints.filter(p => p.id !== pointId);
    this._savedPoints.next(newPoints);
    localStorage.setItem('savedMapPoints', JSON.stringify(newPoints));
  }
  
  getSavedPoints(): MapPoint[] {
    return this._savedPoints.getValue();
  }
  
  initSavedPoints(): void {
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
  
  public clearNearestMonitors(): void {
    this.nearestMonitorsSubject.next([]);
  }
  
  public getNearestMonitors(): MapPoint[] {
    return this.nearestMonitorsSubject.getValue();
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
              resolve({
                latitude: -3.7327, 
                longitude: -38.5270
              });
            }
          }
        );
      } else {
        resolve(this.getUserCoordinates() || {
          latitude: -3.7327, 
          longitude: -38.5270
        });
      }
    });
  }
  
  getUserCoordinates(): {latitude: number, longitude: number} | null {
    try {
      const saved = localStorage.getItem('user_coordinates');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Erro ao ler coordenadas do localStorage:', e);
    }
    return null;
  }
  
  findNearbyMonitors(latitude: number, longitude: number): Promise<MapPoint[]> {
    this.searchingSubject.next(true);
    
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const points: MapPoint[] = [];
          
          for (let i = 0; i < 2; i++) {
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
  
  private adjustCoordinates(latitude: number, longitude: number, index: number): {latitude: number, longitude: number} {
    const baseOffset = 0.00002;
    
    const patterns = [
      { latOffset: 0, lngOffset: 0.00002 },
      { latOffset: baseOffset, lngOffset: 0.00002 },
      { latOffset: 0, lngOffset: baseOffset },
      { latOffset: -baseOffset, lngOffset: 0.00002 },
      { latOffset: 0, lngOffset: -baseOffset },
      { latOffset: baseOffset, lngOffset: baseOffset },
      { latOffset: -baseOffset, lngOffset: baseOffset },
      { latOffset: -baseOffset, lngOffset: -baseOffset },
      { latOffset: baseOffset, lngOffset: -baseOffset }
    ];
    
    const pattern = patterns[index % patterns.length];
    
    return {
      latitude: latitude + pattern.latOffset,
      longitude: longitude + pattern.lngOffset
    };
  }
}
