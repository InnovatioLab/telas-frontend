import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { ResponseDto } from "@app/model/dto/response/response.dto";
import { Authentication } from "@app/core/service/auth/autenthication";
import { AuthenticationStorage } from "@app/core/service/auth/authentication-storage";
import { ENVIRONMENT } from "src/environments/environment-token";
import { Environment } from "src/environments/environment.interface";

export interface FlowEvent {
  occurredAt: string;
  eventType: string;
  actorType: string;
  actorName: string | null;
  label: string;
  detail: string | null;
}

export interface AdFlowSummary {
  adRequestId: string;
  clientName: string;
  adTitle: string | null;
  adMimeType: string | null;
  adPreviewUrl: string | null;
  currentStatus: string;
  lastEventAt: string;
  events: FlowEvent[];
}

export interface AdFlowPage {
  content: AdFlowSummary[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

@Injectable({
  providedIn: "root",
})
export class MonitoringAdFlowService {
  constructor(
    private readonly http: HttpClient,
    @Inject(ENVIRONMENT) private readonly env: Environment,
    private readonly authentication: Authentication
  ) {}

  listFlows(params: {
    clientId?: string;
    page?: number;
    size?: number;
  }): Observable<AdFlowPage> {
    const headers = new HttpHeaders(this.getAuthHeaders());
    let httpParams = new HttpParams();
    if (params.clientId) httpParams = httpParams.set("clientId", params.clientId);
    if (params.page != null) httpParams = httpParams.set("page", String(params.page));
    if (params.size != null) httpParams = httpParams.set("size", String(params.size));

    return this.http
      .get<ResponseDto<AdFlowPage>>(
        `${this.env.apiUrl}admin/ad-flows`,
        { headers, params: httpParams }
      )
      .pipe(map((res) => res.data!));
  }

  private getAuthHeaders(): Record<string, string> {
    const token = this.authentication.token ?? AuthenticationStorage.getToken();
    return { Authorization: `Bearer ${token || ""}` };
  }
}
