import { Inject, Injectable } from "@angular/core";
import { IZipCodeRepository } from "@app/core/interfaces/services/repository/zipcode-repository.interface";
import { MapPoint } from "@app/core/service/state/map-point.interface";
import { ZIPCODE_REPOSITORY_TOKEN } from "@app/core/tokens/injection-tokens";
import { AddressData } from "@app/model/dto/request/address-data-request";
import { BehaviorSubject, Observable, of } from "rxjs";
import { catchError, map, switchMap, tap } from "rxjs/operators";
import { GeocodingResult, GeocodingService } from "./geocoding.service";

@Injectable({
  providedIn: "root",
})
export class ZipCodeService {
  private readonly lastLocationSubject = new BehaviorSubject<{
    addressData: AddressData | null;
    mapPoint: MapPoint | null;
  }>({ addressData: null, mapPoint: null });

  constructor(
    @Inject(ZIPCODE_REPOSITORY_TOKEN)
    private readonly zipCodeRepository: IZipCodeRepository,
    private readonly geocodingService: GeocodingService
  ) {}

  public get lastLocation$(): Observable<{
    addressData: AddressData | null;
    mapPoint: MapPoint | null;
  }> {
    return this.lastLocationSubject.asObservable();
  }

  public findLocationByZipCode(
    zipCode: string
  ): Observable<AddressData | null> {
    if (!zipCode) {
      return of(null);
    }

    return this.zipCodeRepository.findByZipCode(zipCode).pipe(
      switchMap((localResult) => {
        if (localResult) {
          // Se encontrou na API local, retorna o resultado
          return of(localResult);
        }
        // Se não encontrou na API local, tenta Google Maps
        return this.geocodingService
          .geocodeZipCode(zipCode)
          .pipe(
            map((geocodingResult) =>
              geocodingResult
                ? this.mapGeocodingToAddressData(geocodingResult, zipCode)
                : null
            )
          );
      }),
      catchError((error) => {
        console.warn("Local API failed, trying Google Maps:", error);
        // Se a API local falhou, tenta Google Maps como fallback
        return this.geocodingService.geocodeZipCode(zipCode).pipe(
          map((geocodingResult) =>
            geocodingResult
              ? this.mapGeocodingToAddressData(geocodingResult, zipCode)
              : null
          ),
          catchError(() => of(null))
        );
      }),
      tap((result) => {
        if (result) {
          this.processAndEmitLocation(result);
        }
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
          title: `${result.city || ""}, ${result.state || ""} ${result.zipCode}`,
          locationDescription: `${result.street || ""} ${result.city || ""}, ${result.state || ""} ${result.zipCode}`,
          id: `zipcode-${result.zipCode}`,
          category: "ADDRESS",
        };
      }
    }

    this.lastLocationSubject.next({
      addressData: result,
      mapPoint,
    });

    if (mapPoint) {
      this.emitLocationFoundEvent(mapPoint);

      localStorage.setItem(
        "user_coordinates",
        JSON.stringify({
          latitude: mapPoint.latitude,
          longitude: mapPoint.longitude,
          address: mapPoint.title,
          source: "zipcode-search",
        })
      );

      const coordsEvent = new CustomEvent("user-coordinates-updated", {
        detail: {
          latitude: mapPoint.latitude,
          longitude: mapPoint.longitude,
        },
      });
      window.dispatchEvent(coordsEvent);
    }
  }

  private emitLocationFoundEvent(location: MapPoint): void {
    const event = new CustomEvent("zipcode-location-found", {
      detail: { location },
    });
    window.dispatchEvent(event);
  }

  private mapGeocodingToAddressData(
    result: GeocodingResult,
    zipCode: string
  ): AddressData {
    return {
      zipCode: result.zipCode || zipCode,
      latitude: result.latitude.toString(),
      longitude: result.longitude.toString(),
      city: this.extractCityFromAddress(result.formattedAddress),
      state: this.extractStateFromAddress(result.formattedAddress),
      country: "Brasil",
      street: "",
    };
  }

  private extractCityFromAddress(formattedAddress: string): string {
    // Simple extraction - could be improved with more sophisticated parsing
    const parts = formattedAddress.split(",");
    return parts[0]?.trim() || "";
  }

  private extractStateFromAddress(formattedAddress: string): string {
    // Simple extraction - could be improved with more sophisticated parsing
    const parts = formattedAddress.split(",");
    return parts[1]?.trim() || "";
  }

  private isAddressValid(address: AddressData): boolean {
    return !!address.city && !!address.state && !!address.country;
  }

  public getStatesList(): Observable<{ code: string; name: string }[]> {
    const usStates = [
      { code: "AL", name: "Alabama" },
      { code: "AK", name: "Alaska" },
      { code: "AZ", name: "Arizona" },
      { code: "AR", name: "Arkansas" },
      { code: "CA", name: "California" },
      { code: "CO", name: "Colorado" },
      { code: "CT", name: "Connecticut" },
      { code: "DE", name: "Delaware" },
      { code: "FL", name: "Florida" },
      { code: "GA", name: "Georgia" },
      { code: "HI", name: "Hawaii" },
      { code: "ID", name: "Idaho" },
      { code: "IL", name: "Illinois" },
      { code: "IN", name: "Indiana" },
      { code: "IA", name: "Iowa" },
      { code: "KS", name: "Kansas" },
      { code: "KY", name: "Kentucky" },
      { code: "LA", name: "Louisiana" },
      { code: "ME", name: "Maine" },
      { code: "MD", name: "Maryland" },
      { code: "MA", name: "Massachusetts" },
      { code: "MI", name: "Michigan" },
      { code: "MN", name: "Minnesota" },
      { code: "MS", name: "Mississippi" },
      { code: "MO", name: "Missouri" },
      { code: "MT", name: "Montana" },
      { code: "NE", name: "Nebraska" },
      { code: "NV", name: "Nevada" },
      { code: "NH", name: "New Hampshire" },
      { code: "NJ", name: "New Jersey" },
      { code: "NM", name: "New Mexico" },
      { code: "NY", name: "New York" },
      { code: "NC", name: "North Carolina" },
      { code: "ND", name: "North Dakota" },
      { code: "OH", name: "Ohio" },
      { code: "OK", name: "Oklahoma" },
      { code: "OR", name: "Oregon" },
      { code: "PA", name: "Pennsylvania" },
      { code: "RI", name: "Rhode Island" },
      { code: "SC", name: "South Carolina" },
      { code: "SD", name: "South Dakota" },
      { code: "TN", name: "Tennessee" },
      { code: "TX", name: "Texas" },
      { code: "UT", name: "Utah" },
      { code: "VT", name: "Vermont" },
      { code: "VA", name: "Virginia" },
      { code: "WA", name: "Washington" },
      { code: "WV", name: "West Virginia" },
      { code: "WI", name: "Wisconsin" },
      { code: "WY", name: "Wyoming" },
    ];

    return of(usStates);
  }
}
