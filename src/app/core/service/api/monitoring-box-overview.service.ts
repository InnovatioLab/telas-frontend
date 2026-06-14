import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { ResponseDto } from "@app/model/dto/response/response.dto";
import { Authentication } from "@app/core/service/auth/autenthication";
import { AuthenticationStorage } from "@app/core/service/auth/authentication-storage";
import { ENVIRONMENT } from "src/environments/environment-token";
import { Environment } from "src/environments/environment.interface";

export interface MonitorSummary {
  monitorId: string;
  productId: string;
  partnerName: string | null;
  street: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  activeAds: number;
}

export interface BoxOverview {
  boxId: string;
  ip: string | null;
  mac: string | null;
  dns: string | null;
  active: boolean;
  lastSeenAt: string | null;
  reportedVersion: string | null;
  reachable: boolean;
  probeDetail: string | null;
  totalMonitors: number;
  totalActiveAds: number;
  monitors: MonitorSummary[];
}

@Injectable({
  providedIn: "root",
})
export class MonitoringBoxOverviewService {
  constructor(
    private readonly http: HttpClient,
    @Inject(ENVIRONMENT) private readonly env: Environment,
    private readonly authentication: Authentication
  ) {}

  listBoxOverview(): Observable<BoxOverview[]> {
    const headers = new HttpHeaders(this.getAuthHeaders());
    return this.http
      .get<ResponseDto<BoxOverview[]>>(
        `${this.env.apiUrl}admin/box-overview`,
        { headers }
      )
      .pipe(map((res) => res.data ?? []));
  }

  private getAuthHeaders(): Record<string, string> {
    const token = this.authentication.token ?? AuthenticationStorage.getToken();
    return { Authorization: `Bearer ${token || ""}` };
  }
}
