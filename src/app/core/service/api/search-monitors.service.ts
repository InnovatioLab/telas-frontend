import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Inject, Injectable } from "@angular/core";
import { BehaviorSubject, Observable, of } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { ENVIRONMENT } from "src/environments/environment-token";
import { Environment } from "src/environments/environment.interface";
import { MapPoint } from "../state/map-point.interface";

export interface MonitorMapsResponseDto {
  id: string;
  active: boolean;
  latitude: number;
  longitude: number;
  hasAvailableSlots: boolean;
  estimatedSlotReleaseDate?: string;
  adsDailyDisplayTimeInMinutes: number;
  addressLocationName?: string;
  addressLocationDescription?: string;
  monitorLocationDescription?: string;
  photoUrl?: string;
}

export interface NearestMonitorsResponse {
  data: MonitorMapsResponseDto[];
}

export interface ApiResponseDto<T> {
  data: T;
  status: number;
  message: string;
  timestamp: string;
}

@Injectable({
  providedIn: "root",
})
export class SearchMonitorsService {
  private readonly nearestMonitorsSubject = new BehaviorSubject<MapPoint[]>([]);
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  private readonly errorSubject = new BehaviorSubject<string | null>(null);
  private readonly storageName = "telas_token";

  constructor(
    private readonly http: HttpClient,
    @Inject(ENVIRONMENT) private readonly env: Environment
  ) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem(this.storageName);
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  public findNearestMonitors(
    zipCode: string
  ): Observable<MonitorMapsResponseDto[]> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    const url = `${this.env.apiUrl}monitors/search`;
    const headers = this.getAuthHeaders();

    return this.http
      .get<ApiResponseDto<MonitorMapsResponseDto[]>>(url, {
        headers,
        params: { zipCode },
      })
      .pipe(
        map((response) => {
          const monitors = response.data || [];
          const allPoints = this.convertMonitorsToMapPoints(monitors);

          this.nearestMonitorsSubject.next(allPoints);
          this.loadingSubject.next(false);

          // Don't emit error here - let findByZipCode handle it
          return monitors;
        }),
        catchError((error) => {
          this.loadingSubject.next(false);
          const errorMsg =
            error.error?.message ?? "Error searching for nearby monitors";
          this.errorSubject.next(errorMsg);
          return of([]);
        })
      );
  }

  private convertMonitorsToMapPoints(
    monitors: MonitorMapsResponseDto[]
  ): MapPoint[] {
    return monitors
      .filter((monitor) => monitor.latitude && monitor.longitude)
      .map((monitor) => ({
        id: monitor.id,
        title: `Monitor ${monitor.monitorLocationDescription || ""}`,
        description: this.buildMonitorDescription(monitor),
        latitude: monitor.latitude,
        longitude: monitor.longitude,
        category: "MONITOR",
        addressLocationName: monitor.addressLocationName,
        addressLocationDescription: monitor.addressLocationDescription,
        locationDescription: monitor.monitorLocationDescription,
        data: monitor,
      }));
  }

  private buildMonitorDescription(monitor: MonitorMapsResponseDto): string {
    const parts: string[] = [];

    if (monitor.hasAvailableSlots !== undefined) {
      parts.push(
        `Available Slots: ${monitor.hasAvailableSlots ? "Yes" : "No"}`
      );
    }

    if (monitor.adsDailyDisplayTimeInMinutes) {
      parts.push(
        `Daily Display Time: ${monitor.adsDailyDisplayTimeInMinutes} min`
      );
    }

    if (monitor.estimatedSlotReleaseDate && !monitor.hasAvailableSlots) {
      const releaseDate = new Date(monitor.estimatedSlotReleaseDate);
      parts.push(`Next Available: ${releaseDate.toLocaleDateString()}`);
    }

    return parts.join(" | ") || "Monitor Information";
  }

  public findByZipCode(zipCode: string): Promise<MapPoint[]> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);
    if (!zipCode || zipCode.trim().length < 5) {
      this.errorSubject.next("Invalid zip code");
      this.loadingSubject.next(false);
      return Promise.resolve([]);
    }

    const cleanZipCode = zipCode.replace(/\D/g, "");

    return this.findNearestMonitors(cleanZipCode)
      .toPromise()
      .then(() => {
        const points = this.nearestMonitorsSubject.getValue();
        if (points.length === 0) {
          this.errorSubject.next(
            `No monitors found for ZIP code ${cleanZipCode}`
          );
        }
        return points;
      })
      .catch((error): MapPoint[] => {
        this.errorSubject.next("Error searching monitors by zip code");
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
        throw new Error("Address not found");
      }

      const zipCode = this.extractZipCodeFromAddress(
        geocodeResult.formattedAddress
      );

      if (!zipCode) {
        throw new Error("Unable to identify zip code from address");
      }

      const currentPoints = this.nearestMonitorsSubject.getValue();
      return currentPoints;
    } catch (error: any) {
      const errorMessage =
        error?.message ?? "Error searching for nearby monitors";
      this.errorSubject.next(errorMessage);
      return [];
    } finally {
      this.loadingSubject.next(false);
    }
  }

  private extractZipCodeFromAddress(address: string): string | null {
    const brRegex = /\b\d{5}-\d{3}\b/;
    const usRegex = /\b\d{5}(?:-\d{4})?\b/;

    const brMatch = brRegex.exec(address);
    if (brMatch) {
      return brMatch[0].replace("-", "");
    }

    const usMatch = usRegex.exec(address);
    if (usMatch) {
      return usMatch[0].replace("-", "");
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
