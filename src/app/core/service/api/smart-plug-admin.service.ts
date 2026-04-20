import { HttpClient, HttpParams } from "@angular/common/http";
import { Inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { ResponseDto } from "@app/model/dto/response/response.dto";
import { ENVIRONMENT } from "src/environments/environment-token";
import { Environment } from "src/environments/environment.interface";

export interface SmartPlugAdminDto {
  id: string;
  macAddress: string;
  vendor: string;
  model: string | null;
  displayName: string | null;
  monitorId: string | null;
  boxId: string | null;
  enabled: boolean;
  lastSeenIp: string | null;
  accountEmail: string | null;
  passwordConfigured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SmartPlugOverviewDto extends SmartPlugAdminDto {
  monitorAddressSummary: string | null;
  boxIp: string | null;
  lastReadingAt: string | null;
  reachable: boolean;
  relayOn: boolean | null;
  powerWatts: number | null;
  voltageVolts: number | null;
  currentAmperes: number | null;
  errorCode: string | null;
}

export interface SmartPlugHistoryPointDto {
  at: string;
  reachable: boolean;
  relayOn: boolean | null;
  powerWatts: number | null;
  voltageVolts: number | null;
  currentAmperes: number | null;
  errorCode: string | null;
}

export interface SmartPlugReadingResponse {
  reachable: boolean;
  relayOn: boolean | null;
  powerWatts: number | null;
  voltageVolts: number | null;
  currentAmperes: number | null;
  errorCode: string | null;
}

export interface SmartPlugInventoryRequest {
  macAddress: string;
  vendor: string;
  model?: string | null;
  displayName?: string | null;
  accountEmail?: string | null;
  password?: string | null;
  enabled?: boolean | null;
  lastSeenIp?: string | null;
}

@Injectable({
  providedIn: "root",
})
export class SmartPlugAdminService {
  constructor(
    private readonly http: HttpClient,
    @Inject(ENVIRONMENT) private readonly env: Environment
  ) {}

  overview(): Observable<SmartPlugOverviewDto[]> {
    return this.http
      .get<ResponseDto<SmartPlugOverviewDto[]>>(
        `${this.env.apiUrl}monitoring/smart-plugs/overview`,
        { headers: this.headers() }
      )
      .pipe(map((res) => (res?.data as SmartPlugOverviewDto[]) ?? []));
  }

  history(
    plugId: string,
    limit = 200,
    from?: string | null,
    to?: string | null
  ): Observable<SmartPlugHistoryPointDto[]> {
    let params = new HttpParams().set("limit", String(limit));
    if (from) {
      params = params.set("from", from);
    }
    if (to) {
      params = params.set("to", to);
    }
    return this.http
      .get<ResponseDto<SmartPlugHistoryPointDto[]>>(
        `${this.env.apiUrl}monitoring/smart-plugs/${plugId}/history`,
        { headers: this.headers(), params }
      )
      .pipe(map((res) => (res?.data as SmartPlugHistoryPointDto[]) ?? []));
  }

  testRead(plugId: string): Observable<SmartPlugReadingResponse> {
    return this.http
      .post<ResponseDto<SmartPlugReadingResponse>>(
        `${this.env.apiUrl}monitoring/smart-plugs/${plugId}/test-read`,
        {},
        { headers: this.headers() }
      )
      .pipe(map((res) => res.data as SmartPlugReadingResponse));
  }

  listUnassigned(
    forMonitorId?: string | null,
    forBoxId?: string | null
  ): Observable<SmartPlugAdminDto[]> {
    let params = new HttpParams();
    if (forMonitorId) {
      params = params.set("forMonitorId", forMonitorId);
    }
    if (forBoxId) {
      params = params.set("forBoxId", forBoxId);
    }
    return this.http
      .get<ResponseDto<SmartPlugAdminDto[]>>(
        `${this.env.apiUrl}monitoring/smart-plugs/unassigned`,
        {
          headers: this.headers(),
          params,
        }
      )
      .pipe(map((res) => (res?.data as SmartPlugAdminDto[]) ?? []));
  }

  assign(plugId: string, monitorId: string): Observable<SmartPlugAdminDto> {
    return this.http
      .put<ResponseDto<SmartPlugAdminDto>>(
        `${this.env.apiUrl}monitoring/smart-plugs/${plugId}/assign/${monitorId}`,
        {},
        { headers: this.headers() }
      )
      .pipe(map((res) => res.data as SmartPlugAdminDto));
  }

  assignToBox(plugId: string, boxId: string): Observable<SmartPlugAdminDto> {
    return this.http
      .put<ResponseDto<SmartPlugAdminDto>>(
        `${this.env.apiUrl}monitoring/smart-plugs/${plugId}/assign-box/${boxId}`,
        {},
        { headers: this.headers() }
      )
      .pipe(map((res) => res.data as SmartPlugAdminDto));
  }

  unassign(plugId: string): Observable<SmartPlugAdminDto> {
    return this.http
      .put<ResponseDto<SmartPlugAdminDto>>(
        `${this.env.apiUrl}monitoring/smart-plugs/${plugId}/unassign`,
        {},
        { headers: this.headers() }
      )
      .pipe(map((res) => res.data as SmartPlugAdminDto));
  }

  createInventory(
    body: SmartPlugInventoryRequest
  ): Observable<SmartPlugAdminDto> {
    return this.http
      .post<ResponseDto<SmartPlugAdminDto>>(
        `${this.env.apiUrl}monitoring/smart-plugs/unassigned`,
        body,
        { headers: this.headers() }
      )
      .pipe(map((res) => res.data as SmartPlugAdminDto));
  }

  private headers(): Record<string, string> {
    const token = localStorage.getItem("telas_token");
    return {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }
}
