import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { ResponseDto } from "@app/model/dto/response/response.dto";
import { Authentication } from "@app/core/service/auth/autenthication";
import { AuthenticationStorage } from "@app/core/service/auth/authentication-storage";
import { ENVIRONMENT } from "src/environments/environment-token";
import { Environment } from "src/environments/environment.interface";

export interface BoxConnectivityProbeRow {
  boxId: string;
  boxIp: string | null;
  monitorId: string | null;
  monitorAddressSummary: string | null;
  lastProbeAt: string | null;
  reachable: boolean | null;
  probeDetail: string | null;
}

@Injectable({
  providedIn: "root",
})
export class MonitoringBoxConnectivityService {
  constructor(
    private readonly http: HttpClient,
    @Inject(ENVIRONMENT) private readonly env: Environment,
    private readonly authentication: Authentication
  ) {}

  listRows(): Observable<BoxConnectivityProbeRow[]> {
    const headers = new HttpHeaders(this.getAuthHeaders());
    return this.http
      .get<ResponseDto<BoxConnectivityProbeRow[]>>(
        `${this.env.apiUrl}monitoring/box-connectivity-probes`,
        { headers }
      )
      .pipe(map((res) => res.data ?? []));
  }

  runProbesNow(): Observable<BoxConnectivityProbeRow[]> {
    const headers = new HttpHeaders(this.getAuthHeaders());
    return this.http
      .post<ResponseDto<BoxConnectivityProbeRow[]>>(
        `${this.env.apiUrl}monitoring/box-connectivity-probes/run`,
        {},
        { headers }
      )
      .pipe(map((res) => res.data ?? []));
  }

  private getAuthHeaders(): Record<string, string> {
    const token =
      this.authentication.token ?? AuthenticationStorage.getToken();
    return {
      Authorization: `Bearer ${token || ""}`,
    };
  }
}
