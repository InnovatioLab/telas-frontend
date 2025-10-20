import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { MapPoint } from "@app/core/service/state/map-point.interface";
import { AddressData } from "@app/model/dto/request/address-data-request";
import { ResponseDTO } from "@app/model/dto/response.dto";
import { LocalAddressResponse } from "@app/model/dto/response/local-address-response";
import { BehaviorSubject, Observable, of } from "rxjs";
import { catchError, map, switchMap, tap } from "rxjs/operators";
import { ENVIRONMENT } from "src/environments/environment-token";

@Injectable({
  providedIn: "root",
})
export class ZipCodeService {
  private readonly env = inject(ENVIRONMENT);
  private readonly apiKeyBackup = "9bdde870-2bf6-11f0-92e4-ab00f677d113";
  private readonly localApiUrl = this.env.apiUrl || "";

  private readonly lastLocationSubject = new BehaviorSubject<{
    addressData: AddressData | null;
    mapPoint: MapPoint | null;
  }>({ addressData: null, mapPoint: null });

  constructor(private readonly http: HttpClient) {}

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

    return this.findLocationInLocalApi(zipCode).pipe(
      map((localResult) => {
        if (localResult && this.isAddressValid(localResult)) {
          return localResult;
        }
        return null;
      }),
      switchMap((localResult) => {
        if (localResult) {
          return of(localResult);
        }
        return this.findLocationInExternalApi(zipCode);
      }),
      tap((result) => {
        if (result) {
          this.processAndEmitLocation(result);
        }
      }),
      catchError(() => of(null))
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
          type: "ADDRESS",
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

  private isAddressValid(address: AddressData): boolean {
    return !!address.city && !!address.state && !!address.country;
  }

  private findLocationInLocalApi(
    zipCode: string
  ): Observable<AddressData | null> {
    const url = `${this.localApiUrl}addresses/${zipCode}`;

    return this.http.get<ResponseDTO<LocalAddressResponse>>(url).pipe(
      map((response) => {
        if (response.data) {
          return {
            zipCode: response.data?.zipCode,
            street: response.data?.street || "",
            city: response.data?.city || "",
            state: response.data?.state || "",
            country: response.data?.country || "",
          };
        }
        return null;
      }),
      catchError(() => of(null))
    );
  }

  findLocationInExternalApi(zipCode: string): Observable<AddressData | null> {
    const apiKey = this.env.zipCodeApiKey || this.apiKeyBackup;
    const url = `${this.localApiUrl}addresses/${zipCode}`;

    return this.http.get<any>(url).pipe(
      map((response) => {
        const location: AddressData = {
          street: response.places?.[0]?.["place name"] || "",
          city: response.places?.[0]?.["place name"] || "",
          state: response.places?.[0]?.["state abbreviation"] || "",
          country: response.country || "US",
          zipCode: response["post code"] || zipCode,
          latitude: response.places?.[0]?.["latitude"] || "0",
          longitude: response.places?.[0]?.["longitude"] || "0",
        };

        return location;
      }),
      catchError(() => {
        return of(null);
      })
    );
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
