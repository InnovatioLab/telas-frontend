import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { ResponseDto } from "@app/model/dto/response/response.dto";
import { Authentication } from "@app/core/service/auth/autenthication";
import { AuthenticationStorage } from "@app/core/service/auth/authentication-storage";
import { ENVIRONMENT } from "src/environments/environment-token";
import { Environment } from "src/environments/environment.interface";

export interface MonitoringTestingRow {
  boxId: string;
  boxIp: string | null;
  boxActive: boolean;
  lastHeartbeatAt: string | null;
  heartbeatOnline: boolean;
  heartbeatStatus: "ONLINE" | "STALE" | "MISSING";
  monitorId: string | null;
  monitorAddressSummary: string | null;
  monitorActive: boolean | null;
  smartPlugId: string | null;
  smartPlugMac: string | null;
  smartPlugVendor: string | null;
  smartPlugEnabled: boolean | null;
  boxSmartPlugId: string | null;
  boxSmartPlugMac: string | null;
  boxSmartPlugVendor: string | null;
  boxSmartPlugEnabled: boolean | null;
}

export interface BoxHeartbeatCheckResponse {
  boxId: string;
  lastHeartbeatAt: string | null;
  secondsSinceHeartbeat: number | null;
  heartbeatOnline: boolean;
  heartbeatStatus: string;
  staleAfterSeconds: number;
}

export interface SmartPlugReadingResponse {
  reachable: boolean;
  relayOn: boolean | null;
  powerWatts: number | null;
  voltageVolts: number | null;
  currentAmperes: number | null;
  errorCode: string | null;
}

@Injectable({
  providedIn: "root",
})
export class MonitoringTestingService {
  constructor(
    private readonly http: HttpClient,
    @Inject(ENVIRONMENT) private readonly env: Environment,
    private readonly authentication: Authentication
  ) {}

  getOverview(): Observable<MonitoringTestingRow[]> {
    return this.http
      .get<ResponseDto<MonitoringTestingRow[]>>(
        `${this.env.apiUrl}monitoring/testing/overview`,
        { headers: new HttpHeaders(this.getAuthHeaders()) }
      )
      .pipe(map((res) => res.data ?? []));
  }

  checkBox(boxId: string): Observable<BoxHeartbeatCheckResponse> {
    return this.http
      .post<ResponseDto<BoxHeartbeatCheckResponse>>(
        `${this.env.apiUrl}monitoring/testing/boxes/${boxId}/check`,
        {},
        { headers: new HttpHeaders(this.getAuthHeaders()) }
      )
      .pipe(map((res) => res.data as BoxHeartbeatCheckResponse));
  }

  testReadSmartPlug(smartPlugId: string): Observable<SmartPlugReadingResponse> {
    return this.http
      .post<ResponseDto<SmartPlugReadingResponse>>(
        `${this.env.apiUrl}monitoring/smart-plugs/${smartPlugId}/test-read`,
        {},
        { headers: new HttpHeaders(this.getAuthHeaders()) }
      )
      .pipe(map((res) => res.data as SmartPlugReadingResponse));
  }

  private getAuthHeaders(): Record<string, string> {
    const token =
      this.authentication.token ?? AuthenticationStorage.getToken();
    return {
      Authorization: `Bearer ${token || ""}`,
    };
  }
}
