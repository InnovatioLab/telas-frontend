import { Inject, Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { ENVIRONMENT } from "src/environments/environment-token";
import { Environment } from "src/environments/environment.interface";
import { LoadingService } from "../state/loading.service";
import { MapPoint } from "../state/map-point.interface";

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

export interface PlaceDetails {
  name: string;
  description?: string;
  formattedAddress: string;
  placeId: string;
  types: string[];
  businessStatus?: string;
  rating?: number;
  userRatingsTotal?: number;
  photos?: google.maps.places.PlacePhoto[];
  website?: string;
  phoneNumber?: string;
}

@Injectable({
  providedIn: "root",
})
export class GoogleMapsService {
  private readonly apiLoadedSubject = new BehaviorSubject<boolean>(false);
  private readonly apiErrorSubject = new BehaviorSubject<string | null>(null);
  private readonly selectedPointSubject = new BehaviorSubject<MapPoint | null>(
    null
  );
  private readonly searchingSubject = new BehaviorSubject<boolean>(false);
  private readonly searchErrorSubject = new BehaviorSubject<string | null>(
    null
  );
  private readonly searchResultSubject =
    new BehaviorSubject<AddressSearchResult | null>(null);
  private readonly searchHistorySubject = new BehaviorSubject<
    AddressSearchResult[]
  >([]);
  private readonly _savedPoints = new BehaviorSubject<MapPoint[]>([]);
  private readonly nearestMonitorsSubject = new BehaviorSubject<MapPoint[]>([]);

  private readonly callbackName = "googleMapsInitialized";
  private readonly MAX_HISTORY_ITEMS = 10;
  private apiInitializationAttempts = 0;
  private readonly MAX_INITIALIZATION_ATTEMPTS = 5;
  private apiLoadingInProgress = false;
  private apiLoadingPromise: Promise<void> | null = null;
  private apiCallback: (() => void) | null = null;

  constructor(
    @Inject(ENVIRONMENT) private readonly env: Environment,
    private readonly loadingService: LoadingService
  ) {
    window.addEventListener("address-to-geocode", ((e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.address) {
        this.checkAndGeocodeStoredAddress();
      }
    }) as EventListener);
  }

  public initGoogleMapsApi(): void {
    if (typeof google !== "undefined" && google.maps?.Map) {
      this.apiLoadedSubject.next(true);
      this.apiErrorSubject.next(null);
      this.apiInitializationAttempts = 0;
      this.apiLoadingInProgress = false;
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
      if (
        !this.apiLoadedSubject.getValue() &&
        this.apiInitializationAttempts < this.MAX_INITIALIZATION_ATTEMPTS
      ) {
        this.removeExistingScripts();
        this.apiLoadingInProgress = false;
        this.initGoogleMapsApi();
      } else if (
        this.apiInitializationAttempts >= this.MAX_INITIALIZATION_ATTEMPTS
      ) {
        this.apiErrorSubject.next(
          "Não foi possível carregar o Google Maps. Tente novamente mais tarde."
        );
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

    const script = document.createElement("script");
    const apiKey = this.env.googleMapsApiKey;

    if (!apiKey) {
      this.apiErrorSubject.next("API Key do Google Maps não configurada.");
      this.apiLoadingInProgress = false;
      return;
    }

    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=${this.callbackName}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.id = "google-maps-script";

    script.onerror = (error) => {
      clearTimeout(timeoutCheck);
      this.apiErrorSubject.next(
        "Erro ao carregar o Google Maps. Tentando novamente..."
      );
      this.apiLoadingInProgress = false;
      if (this.apiInitializationAttempts < this.MAX_INITIALIZATION_ATTEMPTS) {
        setTimeout(() => this.initGoogleMapsApi(), 2000);
      }
    };

    document.head.appendChild(script);
  }

  private removeExistingScripts(): void {
    const existingScript = document.getElementById("google-maps-script");
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

  public convertToMarkerPositions(
    points: MapPoint[]
  ): google.maps.LatLngLiteral[] {
    return points.map((point) => ({
      lat: point.latitude,
      lng: point.longitude,
    }));
  }

  public createMarkerOptions(
    point: MapPoint
  ): google.maps.marker.AdvancedMarkerElementOptions {
    const options: google.maps.marker.AdvancedMarkerElementOptions = {
      gmpDraggable: false,
      title: point.title || "",
    };

    if (point.icon) {
      (options as any).glyph = point.icon;
    }

    return options;
  }

  public createRedMarkerIcon(): google.maps.Symbol {
    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: "#FF0000",
      fillOpacity: 1,
      strokeWeight: 1,
      strokeColor: "#FFFFFF",
      scale: 8,
    };
  }

  public createSearchMarkerIcon(): google.maps.Symbol {
    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: "#4285F4",
      fillOpacity: 1,
      strokeWeight: 2,
      strokeColor: "#FFFFFF",
      scale: 10,
    };
  }

  public createMonitorIcon(): google.maps.Symbol {
    return {
      path: "M20 3H4C2.9 3 2 3.9 2 5V17C2 18.1 2.9 19 4 19H8V21H16V19H20C21.1 19 22 18.1 22 17V5C22 3.9 21.1 3 20 3ZM20 17H4V5H20V17ZM6 7H18V15H6V7Z",
      fillColor: "#232F3E",
      fillOpacity: 1,
      strokeWeight: 2,
      strokeColor: "#FFFFFF",
      scale: 1.8,
    };
  }

  public loadPointsFromSavedLocation(): void {
    try {
      const savedCoordinates = localStorage.getItem("user_coordinates");
      if (savedCoordinates) {
        const coordinates = JSON.parse(savedCoordinates);
        if (coordinates?.latitude && coordinates?.longitude) {
          const event = new CustomEvent("user-coordinates-updated", {
            detail: {
              latitude: coordinates.latitude,
              longitude: coordinates.longitude,
            },
          });
          window.dispatchEvent(event);
        }
      }
    } catch (error) {}
  }

  public selectPoint(point: MapPoint | null): void {
    this.selectedPointSubject.next(point);
  }

  public async checkAndGeocodeStoredAddress(): Promise<void> {
    const addressToGeocode = localStorage.getItem("address_to_geocode");
    if (!addressToGeocode) return;

    try {
      if (!this.apiLoadedSubject.value) {
        await new Promise<void>((resolve) => {
          const subscription = this.apiLoaded$.subscribe((loaded) => {
            if (loaded) {
              subscription.unsubscribe();
              resolve();
            }
          });
        });
      }

      const result = await this.searchAddress(addressToGeocode);
      if (result) {
        localStorage.setItem(
          "user_coordinates",
          JSON.stringify({
            latitude: result.location.latitude,
            longitude: result.location.longitude,
            address: result.formattedAddress,
            source: "user",
          })
        );

        localStorage.removeItem("address_to_geocode");

        this.searchResultSubject.next({
          location: result.location,
          formattedAddress: result.formattedAddress,
        });

        const event = new CustomEvent("user-coordinates-updated", {
          detail: {
            latitude: result.location.latitude,
            longitude: result.location.longitude,
          },
        });
        window.dispatchEvent(event);
      }
    } catch (error) {}
  }

  public async performAddressSearch(query: string): Promise<void> {
    if (!query?.trim()) {
      this.searchErrorSubject.next("Please enter an address to search");
      return;
    }

    this.searchingSubject.next(true);
    this.searchErrorSubject.next(null);

    try {
      const result = await this.searchAddress(query);

      if (!result) {
        this.searchErrorSubject.next("Address not found");
        this.searchingSubject.next(false);
        return;
      }

      const searchResult: AddressSearchResult = {
        ...result,
        timestamp: new Date(),
        query,
      };

      this.searchResultSubject.next(searchResult);
      this.addToSearchHistory(searchResult);
      this.selectPoint(result.location);

      localStorage.setItem(
        "user_coordinates",
        JSON.stringify({
          latitude: result.location.latitude,
          longitude: result.location.longitude,
          address: result.formattedAddress,
          source: "user",
        })
      );
    } catch (error) {
      this.searchErrorSubject.next("Error searching for address");
    } finally {
      this.searchingSubject.next(false);
    }
  }

  private addToSearchHistory(result: AddressSearchResult): void {
    const currentHistory = this.searchHistorySubject.getValue();
    const newHistory = [result, ...currentHistory].slice(
      0,
      this.MAX_HISTORY_ITEMS
    );
    this.searchHistorySubject.next(newHistory);
    localStorage.setItem("addressSearchHistory", JSON.stringify(newHistory));
  }

  public loadSearchHistoryFromLocalStorage(): void {
    try {
      const savedHistory = localStorage.getItem("addressSearchHistory");
      if (savedHistory) {
        const history: AddressSearchResult[] = JSON.parse(savedHistory);
        this.searchHistorySubject.next(history);
      }
    } catch (error) {}
  }

  public addToSavedPoints(point: MapPoint): void {
    if (!point) return;

    const currentPoints = this._savedPoints.getValue();
    if (!currentPoints.some((p) => p.id === point.id)) {
      const newPoints = [...currentPoints, point];
      this._savedPoints.next(newPoints);
      localStorage.setItem("savedMapPoints", JSON.stringify(newPoints));
    }
  }

  public getSavedPoints(): MapPoint[] {
    return this._savedPoints.getValue();
  }

  public initSavedPoints(): void {
    const savedItems = localStorage.getItem("savedMapPoints");
    if (savedItems) {
      try {
        const points = JSON.parse(savedItems);
        this._savedPoints.next(points);
      } catch (e) {}
    }
  }

  public updateNearestMonitors(monitors: MapPoint[]): void {
    this.nearestMonitorsSubject.next(monitors);
  }

  public getNearestMonitors(): MapPoint[] {
    return this.nearestMonitorsSubject.getValue();
  }

  public async searchAddress(address: string): Promise<{
    location: MapPoint;
    formattedAddress: string;
  } | null> {
    if (!address?.trim()) {
      return null;
    }

    if (typeof google === "undefined" || !google.maps) {
      return null;
    }

    const geocoder = new google.maps.Geocoder();

    try {
      const result = await new Promise<google.maps.GeocoderResult | null>(
        (resolve, reject) => {
          geocoder.geocode({ address: address.trim() }, (results, status) => {
            if (
              status === google.maps.GeocoderStatus.OK &&
              results &&
              results.length > 0
            ) {
              resolve(results[0]);
            } else {
              resolve(null);
            }
          });
        }
      );

      if (!result) {
        return null;
      }

      const location = {
        latitude: result.geometry.location.lat(),
        longitude: result.geometry.location.lng(),
        title: result.formatted_address,
      };

      return {
        location,
        formattedAddress: result.formatted_address,
      };
    } catch (error) {
      return null;
    }
  }

  public getCurrentLocation(): Promise<{
    latitude: number;
    longitude: number;
  } | null> {
    return new Promise((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const coordinates = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            };

            localStorage.setItem(
              "user_coordinates",
              JSON.stringify(coordinates)
            );

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

  private getUserCoordinates(): { latitude: number; longitude: number } | null {
    try {
      const savedData = localStorage.getItem("user_coordinates");
      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (parsed?.latitude && parsed?.longitude) {
          return {
            latitude: parsed.latitude,
            longitude: parsed.longitude,
          };
        }
      }
    } catch (e) {
      console.error("Erro ao ler coordenadas salvas:", e);
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
            const adjustedCoords = this.adjustCoordinates(
              latitude,
              longitude,
              i
            );

            points.push({
              id: `monitor-${i}`,
              latitude: adjustedCoords.latitude,
              longitude: adjustedCoords.longitude,
              title: `Monitor ${i + 1}`,
              description: `Monitor located at the specified address`,
              type: "MONITOR",
              category: "MONITOR",
              data: {
                id: `id-${i}`,
                active: true,
                type: i === 0 ? "BASIC" : "PREMIUM",
                size: i === 0 ? 40 : 55,
                distanceInKm: 0,
                latitude: adjustedCoords.latitude,
                longitude: adjustedCoords.longitude,
              },
            });
          }

          this.updateNearestMonitors(points);
          this.searchingSubject.next(false);
          resolve(points);
        } catch (error) {
          this.searchingSubject.next(false);
          this.searchErrorSubject.next("Error processing nearby points");
          reject(error);
        }
      }, 1000);
    });
  }

  private adjustCoordinates(
    latitude: number,
    longitude: number,
    index: number
  ): { latitude: number; longitude: number } {
    const offset = 0.001;
    return {
      latitude: latitude + offset * index,
      longitude: longitude + offset * index,
    };
  }

  public updateSavedPoints(points: MapPoint[]): void {
    this._savedPoints.next(points);
    localStorage.setItem("savedMapPoints", JSON.stringify(points));
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
      this.initGoogleMapsApi();
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
        reject(new Error("Google Maps API loading timeout"));
      }, 10000);

      this.apiCallback = () => {
        clearTimeout(timeout);
        this.apiLoadedSubject.next(true);
        this.apiErrorSubject.next(null);
        this.apiLoadingPromise = null;
        resolve();
      };

      const script = document.createElement("script");
      const apiKey = this.env.googleMapsApiKey;

      if (!apiKey) {
        this.apiErrorSubject.next("API Key do Google Maps não configurada.");
        this.apiLoadingInProgress = false;
        reject(new Error("API Key do Google Maps não configurada."));
        return;
      }

      script.async = true;
      script.defer = true;
      script.id = "google-maps-script";

      script.onerror = (error) => {
        clearTimeout(timeout);
        this.apiLoadingPromise = null;
        this.apiErrorSubject.next(
          "Erro ao carregar o Google Maps. Tentando novamente..."
        );
        if (this.apiInitializationAttempts < this.MAX_INITIALIZATION_ATTEMPTS) {
          setTimeout(() => this.initGoogleMapsApi(), 2000);
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
        if (
          status === google.maps.GeocoderStatus.OK &&
          results &&
          results.length > 0
        ) {
          const result = results[0];
          const location = result.geometry.location;

          const geocodingResult: GeocodingResult = {
            latitude: location.lat(),
            longitude: location.lng(),
            formattedAddress: result.formatted_address,
            placeId: result.place_id,
            addressComponents: result.address_components,
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
      this.initGoogleMapsApi();
      return false;
    }
    return true;
  }

  /**
   * Searches for detailed location information using Places API (Nearby Search)
   * @param latitude - Location latitude
   * @param longitude - Location longitude
   * @param radius - Search radius in meters (default: 50m)
   * @returns Promise with the nearest location details
   */
  public async getPlaceDetailsByCoordinates(
    latitude: number,
    longitude: number,
    radius: number = 50
  ): Promise<PlaceDetails | null> {
    if (!this.apiLoadedSubject.value) {
      await this.loadGoogleMapsAPI();
    }

    if (typeof google === "undefined" || !google.maps || !google.maps.places) {
      throw new Error("Google Maps Places API is not loaded");
    }

    try {
      const location = new google.maps.LatLng(latitude, longitude);
      const request: google.maps.places.PlaceSearchRequest = {
        location: location,
        radius: radius,
        type: "establishment",
      };

      const service = new google.maps.places.PlacesService(
        document.createElement("div")
      );

      return new Promise((resolve, reject) => {
        service.nearbySearch(request, (results, status) => {
          if (
            status === google.maps.places.PlacesServiceStatus.OK &&
            results &&
            results.length > 0
          ) {
            const place = results[0];

            // Get additional place details
            this.getPlaceDetailsById(place.place_id!)
              .then((placeDetails) => resolve(placeDetails))
              .catch(() => {
                // If details fetch fails, return basic information
                resolve({
                  name: place.name || "Unknown location",
                  description: this.generatePlaceDescription(place),
                  formattedAddress: place.vicinity || "",
                  placeId: place.place_id || "",
                  types: place.types || [],
                  businessStatus: place.business_status,
                  rating: place.rating,
                  userRatingsTotal: place.user_ratings_total,
                  photos: place.photos,
                });
              });
          } else if (
            status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS
          ) {
            // If no establishments found, try reverse geocoding
            this.reverseGeocode(latitude, longitude)
              .then((geocodingResult) => {
                if (geocodingResult) {
                  resolve({
                    name: this.extractLocationNameFromAddress(
                      geocodingResult.formattedAddress
                    ),
                    description: `Location at ${geocodingResult.formattedAddress}`,
                    formattedAddress: geocodingResult.formattedAddress,
                    placeId: geocodingResult.placeId,
                    types: ["geocode"],
                  });
                } else {
                  resolve(null);
                }
              })
              .catch(() => resolve(null));
          } else {
            resolve(null);
          }
        });
      });
    } catch (error) {
      console.error("Error fetching location details:", error);
      return null;
    }
  }

  /**
   * Searches for specific location details using Place ID
   * @param placeId - Unique place ID in Google Places
   * @returns Promise with complete location details
   */
  public async getPlaceDetailsById(
    placeId: string
  ): Promise<PlaceDetails | null> {
    if (!this.apiLoadedSubject.value) {
      await this.loadGoogleMapsAPI();
    }

    if (typeof google === "undefined" || !google.maps || !google.maps.places) {
      throw new Error("Google Maps Places API is not loaded");
    }

    try {
      const request: google.maps.places.PlaceDetailsRequest = {
        placeId: placeId,
        fields: [
          "name",
          "formatted_address",
          "place_id",
          "types",
          "business_status",
          "rating",
          "user_ratings_total",
          "photos",
          "website",
          "formatted_phone_number",
          "editorial_summary",
        ],
      };

      const service = new google.maps.places.PlacesService(
        document.createElement("div")
      );

      return new Promise((resolve, reject) => {
        service.getDetails(request, (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place) {
            resolve({
              name: place.name || "Unknown location",
              description: this.generateDetailedPlaceDescription(place),
              formattedAddress: place.formatted_address || "",
              placeId: place.place_id || "",
              types: place.types || [],
              businessStatus: place.business_status,
              rating: place.rating,
              userRatingsTotal: place.user_ratings_total,
              photos: place.photos,
              website: place.website,
              phoneNumber: place.formatted_phone_number,
            });
          } else {
            resolve(null);
          }
        });
      });
    } catch (error) {
      console.error("Error fetching location details by ID:", error);
      return null;
    }
  }

  /**
   * Performs reverse geocoding to get address information
   * @param latitude - Location latitude
   * @param longitude - Location longitude
   * @returns Promise with reverse geocoding result
   */
  public async reverseGeocode(
    latitude: number,
    longitude: number
  ): Promise<GeocodingResult | null> {
    if (!this.apiLoadedSubject.value) {
      await this.loadGoogleMapsAPI();
    }

    if (typeof google === "undefined" || !google.maps) {
      throw new Error("Google Maps API is not loaded");
    }

    try {
      const geocoder = new google.maps.Geocoder();
      const latlng = { lat: latitude, lng: longitude };

      return new Promise((resolve, reject) => {
        geocoder.geocode({ location: latlng }, (results, status) => {
          if (
            status === google.maps.GeocoderStatus.OK &&
            results &&
            results.length > 0
          ) {
            const result = results[0];
            resolve({
              latitude,
              longitude,
              formattedAddress: result.formatted_address,
              placeId: result.place_id,
              addressComponents: result.address_components,
            });
          } else {
            resolve(null);
          }
        });
      });
    } catch (error) {
      console.error("Error in reverse geocoding:", error);
      return null;
    }
  }

  /**
   * Generates a description for a place based on types and available information
   * @param place - Place object returned by Places API
   * @returns String with the generated description
   */
  private generatePlaceDescription(
    place: google.maps.places.PlaceResult
  ): string {
    const types = place.types || [];
    const name = place.name || "Location";

    // Map types to English descriptions
    const typeDescriptions: { [key: string]: string } = {
      restaurant: "Restaurant",
      food: "Food establishment",
      store: "Store",
      shopping_mall: "Shopping mall",
      bank: "Bank",
      hospital: "Hospital",
      school: "School",
      gas_station: "Gas station",
      pharmacy: "Pharmacy",
      supermarket: "Supermarket",
      gym: "Gym",
      park: "Park",
      church: "Church",
      museum: "Museum",
      library: "Library",
      hotel: "Hotel",
      cafe: "Cafe",
      bar: "Bar",
      establishment: "Business establishment",
      lodging: "Lodging",
      tourist_attraction: "Tourist attraction",
      amusement_park: "Amusement park",
      aquarium: "Aquarium",
      art_gallery: "Art gallery",
      bakery: "Bakery",
      beauty_salon: "Beauty salon",
      book_store: "Book store",
      bowling_alley: "Bowling alley",
      car_dealer: "Car dealer",
      car_rental: "Car rental",
      car_repair: "Car repair",
      car_wash: "Car wash",
      casino: "Casino",
      cemetery: "Cemetery",
      clothing_store: "Clothing store",
      convenience_store: "Convenience store",
      courthouse: "Courthouse",
      dentist: "Dentist",
      department_store: "Department store",
      doctor: "Doctor",
      drugstore: "Drugstore",
      electrician: "Electrician",
      electronics_store: "Electronics store",
      embassy: "Embassy",
      fire_station: "Fire station",
      florist: "Florist",
      funeral_home: "Funeral home",
      furniture_store: "Furniture store",
      hair_care: "Hair care",
      hardware_store: "Hardware store",
      home_goods_store: "Home goods store",
      insurance_agency: "Insurance agency",
      jewelry_store: "Jewelry store",
      laundry: "Laundry",
      lawyer: "Lawyer",
      liquor_store: "Liquor store",
      locksmith: "Locksmith",
      meal_delivery: "Meal delivery",
      meal_takeaway: "Meal takeaway",
      movie_theater: "Movie theater",
      moving_company: "Moving company",
      night_club: "Night club",
      painter: "Painter",
      pet_store: "Pet store",
      plumber: "Plumber",
      police: "Police",
      post_office: "Post office",
      real_estate_agency: "Real estate agency",
      roofing_contractor: "Roofing contractor",
      rv_park: "RV park",
      shoe_store: "Shoe store",
      spa: "Spa",
      stadium: "Stadium",
      storage: "Storage",
      subway_station: "Subway station",
      taxi_stand: "Taxi stand",
      train_station: "Train station",
      transit_station: "Transit station",
      travel_agency: "Travel agency",
      university: "University",
      veterinary_care: "Veterinary care",
      zoo: "Zoo",
    };

    for (const type of types) {
      if (typeDescriptions[type]) {
        return `${typeDescriptions[type]} located at ${place.vicinity || "address not specified"}`;
      }
    }

    return `Establishment located at ${place.vicinity || "address not specified"}`;
  }

  /**
   * Generates a detailed description for a place with complete information
   * @param place - Complete place object with details
   * @returns String with the detailed description
   */
  private generateDetailedPlaceDescription(
    place: google.maps.places.PlaceResult
  ): string {
    let description = "";

    // Use editorial summary if available
    if ((place as any).editorial_summary?.overview) {
      return (place as any).editorial_summary.overview;
    }

    // Generate description based on types and available information
    const types = place.types || [];
    const name = place.name || "Location";

    if (types.includes("restaurant") || types.includes("food")) {
      description = `Food establishment`;
    } else if (types.includes("store") || types.includes("establishment")) {
      description = `Business establishment`;
    } else if (types.includes("tourist_attraction")) {
      description = `Tourist attraction`;
    } else {
      description = `Point of interest`;
    }

    if (place.rating) {
      description += ` with ${place.rating} star rating`;
      if (place.user_ratings_total) {
        description += ` (${place.user_ratings_total} reviews)`;
      }
    }

    if (place.business_status === "OPERATIONAL") {
      description += ` - Currently open`;
    } else if (place.business_status === "CLOSED_TEMPORARILY") {
      description += ` - Temporarily closed`;
    } else if (place.business_status === "CLOSED_PERMANENTLY") {
      description += ` - Permanently closed`;
    }

    return description;
  }

  /**
   * Extracts a location name from the formatted address
   * @param address - Formatted address
   * @returns Extracted location name
   */
  private extractLocationNameFromAddress(address: string): string {
    const parts = address.split(",");
    if (parts.length > 0) {
      // Get the first part which is usually the street name or location
      const firstPart = parts[0].trim();

      // If it starts with a number, get the second part
      if (/^\d+/.test(firstPart) && parts.length > 1) {
        return parts[1].trim();
      }

      return firstPart;
    }
    return "Unknown location";
  }
}
