import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { ResponseDto } from "@app/model/dto/response/response.dto";
import { Authentication } from "@app/core/service/auth/autenthication";
import { AuthenticationStorage } from "@app/core/service/auth/authentication-storage";
import { ENVIRONMENT } from "src/environments/environment-token";
import { Environment } from "src/environments/environment.interface";

export interface ConnectivityProbeSettings {
  intervalMs: number;
}

@Injectable({
  providedIn: "root",
})
export class MonitoringConnectivityProbeSettingsService {
  constructor(
    private readonly http: HttpClient,
    @Inject(ENVIRONMENT) private readonly env: Environment,
    private readonly authentication: Authentication
  ) {}

  getSettings(): Observable<ConnectivityProbeSettings> {
    const headers = new HttpHeaders(this.getAuthHeaders());
    return this.http
      .get<ResponseDto<ConnectivityProbeSettings>>(
        `${this.env.apiUrl}monitoring/box-connectivity-probe/settings`,
        { headers }
      )
      .pipe(map((res) => res.data ?? { intervalMs: 10000 }));
  }

  updateSettings(intervalMs: number): Observable<ConnectivityProbeSettings> {
    const headers = new HttpHeaders(this.getAuthHeaders());
    return this.http
      .put<ResponseDto<ConnectivityProbeSettings>>(
        `${this.env.apiUrl}monitoring/box-connectivity-probe/settings`,
        { intervalMs },
        { headers }
      )
      .pipe(map((res) => res.data ?? { intervalMs }));
  }

  private getAuthHeaders(): Record<string, string> {
    const token =
      this.authentication.token ?? AuthenticationStorage.getToken();
    return {
      Authorization: `Bearer ${token || ""}`,
    };
  }
}
