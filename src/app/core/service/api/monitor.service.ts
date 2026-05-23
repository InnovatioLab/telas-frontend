import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Inject, Injectable } from "@angular/core";
import {
  CreateMonitorRequestDto,
  UpdateMonitorRequestDto,
} from "@app/model/dto/request/create-monitor.request.dto";
import { FilterMonitorRequestDto } from "@app/model/dto/request/filter-monitor.request.dto";
import { AvailablePartnerAddressResponseDto } from "@app/model/dto/response/available-partner-address.response.dto";
import { PaginationResponseDto } from "@app/model/dto/response/pagination-response.dto";
import { Monitor } from "@app/model/monitors";
import { MonitorResponseDto } from "@app/model/dto/response/monitor-response.dto";
import { Observable, of } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { IMonitorRepository } from "@app/core/interfaces/services/repository/monitor-repository.interface";
import { MONITOR_REPOSITORY_TOKEN } from "@app/core/tokens/injection-tokens";
import { IMonitorAlert } from "./interfaces/monitor";
import { IncidentApiDto } from "./interfaces/incident-api";
import { ENVIRONMENT } from "src/environments/environment-token";
import { Environment } from "src/environments/environment.interface";
import { AttachmentRequestDto } from "@app/model/dto/request/attachment-request.dto";
import { PartnerAdSubmissionRequestDto } from "@app/model/dto/request/partner-ad-submission.request.dto";

interface ApiEnvelope<T> {
  data?: T;
}

@Injectable({
  providedIn: "root",
})
export class MonitorService {
  private readonly storageName = "telas_token";

  constructor(
    @Inject(MONITOR_REPOSITORY_TOKEN) 
    private readonly repository: IMonitorRepository,
    private readonly http: HttpClient,
    @Inject(ENVIRONMENT) private readonly env: Environment
  ) {}

  getMonitorsWithPagination(filters?: FilterMonitorRequestDto): Observable<PaginationResponseDto<Monitor>> {
    return this.repository.findWithPagination(filters);
  }

  getMonitorById(id: string): Observable<Monitor | null> {
    return this.repository.findById(id);
  }

  createMonitor(monitorRequest: CreateMonitorRequestDto): Observable<Monitor | null> {
    return this.repository.create(monitorRequest).pipe(
      map((monitor) => (monitor?.id ? monitor : null))
    );
  }

  updateMonitor(id: string, monitorRequest: UpdateMonitorRequestDto): Observable<boolean> {
    return this.repository.update(id, monitorRequest).pipe(map(monitor => !!monitor));
  }

  deleteMonitor(id: string): Observable<boolean> {
    return this.repository.delete(id).pipe(map(result => typeof result === 'boolean' ? result : true));
  }

  getAvailablePartnerAddresses(
    q?: string
  ): Observable<AvailablePartnerAddressResponseDto[]> {
    const headers = this.getAuthHeaders();
    let params = new HttpParams();
    const trimmed = (q ?? "").trim();
    if (trimmed.length > 0) {
      params = params.set("q", trimmed);
    }
    return this.http
      .get<ApiEnvelope<AvailablePartnerAddressResponseDto[]>>(
        `${this.env.apiUrl}addresses/partners/available`,
        { headers, params }
      )
      .pipe(
        map((res) => (Array.isArray(res?.data) ? res.data : [])),
        catchError(() => of([]))
      );
  }

  getValidAds(monitorId: string): Observable<any[]> {
    return this.repository.findValidAds(monitorId);
  }

  getPartnerScreens(): Observable<Monitor[]> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<ApiEnvelope<MonitorResponseDto[]>>(
        `${this.env.apiUrl}monitors/partner/my-screens`,
        { headers }
      )
      .pipe(
        map((res) => {
          const list = Array.isArray(res?.data) ? res.data : [];
          return list.map((dto) => this.mapMonitorResponseToMonitor(dto));
        }),
        catchError(() => of([]))
      );
  }

  uploadDirectAdToMonitor(
    monitorId: string,
    payload: AttachmentRequestDto
  ): Observable<string> {
    const headers = this.getAuthHeaders();
    return this.http
      .post<ApiEnvelope<string>>(
        `${this.env.apiUrl}monitors/${encodeURIComponent(monitorId)}/direct-ad`,
        payload,
        { headers }
      )
      .pipe(map((res) => String(res?.data ?? "")));
  }

  getPartnerPlacementTarget(monitorId: string): Observable<Monitor> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<ApiEnvelope<MonitorResponseDto>>(
        `${this.env.apiUrl}monitors/partner/placement-target/${encodeURIComponent(monitorId)}`,
        { headers }
      )
      .pipe(
        map((res) => {
          const dto = res?.data;
          if (!dto?.id) {
            throw new Error("Monitor not found");
          }
          return this.mapMonitorResponseToMonitor(dto);
        })
      );
  }

  submitPartnerAdSubmission(
    monitorId: string,
    payload: PartnerAdSubmissionRequestDto
  ): Observable<string> {
    const headers = this.getAuthHeaders();
    return this.http
      .post<ApiEnvelope<string>>(
        `${this.env.apiUrl}monitors/${encodeURIComponent(monitorId)}/partner-submissions`,
        payload,
        { headers }
      )
      .pipe(map((res) => String(res?.data ?? "")));
  }

  deleteAvailableAd(monitorId: string, adId: string): Observable<void> {
    const headers = this.getAuthHeaders();
    return this.http
      .delete(
        `${this.env.apiUrl}monitors/${encodeURIComponent(monitorId)}/available-ads/${encodeURIComponent(adId)}`,
        { headers }
      )
      .pipe(map((): void => void 0));
  }

  getMonitorAlerts(monitorId?: string): Observable<IMonitorAlert[]> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<ApiEnvelope<PaginationResponseDto<IncidentApiDto>>>(
        `${this.env.apiUrl}monitoring/incidents`,
        {
        headers,
        params: {
          page: "0",
          size: "500",
          sort: "openedAt,desc",
        },
      })
      .pipe(
        map((res) => {
          const list = res?.data?.list ?? [];
          const mapped = list.map((inc) => this.mapIncidentToAlert(inc));
          if (monitorId) {
            return mapped.filter((a) => a.monitorId === monitorId);
          }
          return mapped;
        }),
        catchError(() => of([]))
      );
  }

  acknowledgeAlert(alertId: string, reason: string): Observable<IMonitorAlert> {
    const headers = this.getAuthHeaders();
    return this.http
      .post<ApiEnvelope<IncidentApiDto>>(
        `${this.env.apiUrl}monitoring/incidents/${encodeURIComponent(alertId)}/acknowledge`,
        { reason },
        { headers }
      )
      .pipe(
        map((res) =>
          this.mapIncidentToAlert(this.requireIncidentPayload(res?.data))
        )
      );
  }

  resolveAlert(alertId: string): Observable<IMonitorAlert> {
    const headers = this.getAuthHeaders();
    return this.http
      .post<ApiEnvelope<IncidentApiDto>>(
        `${this.env.apiUrl}monitoring/incidents/${encodeURIComponent(alertId)}/resolve`,
        null,
        { headers }
      )
      .pipe(
        map((res) =>
          this.mapIncidentToAlert(this.requireIncidentPayload(res?.data))
        )
      );
  }

  private mapMonitorResponseToMonitor(monitorResponse: MonitorResponseDto): Monitor {
    return {
      id: monitorResponse.id,
      active: monitorResponse.active,
      fullAddress: monitorResponse.fullAddress,
      address: monitorResponse.address ?? {
        id: "",
        street: "",
        city: "",
        state: "",
        country: "",
        zipCode: "",
      },
      adLinks: monitorResponse.adLinks ?? [],
      canBeDeleted: monitorResponse.canBeDeleted,
      createdAt: monitorResponse.createdAt,
      updatedAt: monitorResponse.updatedAt,
      maxAds: monitorResponse.maxAds,
      activeAdsCount: monitorResponse.activeAdsCount,
      partnerAdsCount: monitorResponse.partnerAdsCount,
      clientAdsCount: monitorResponse.clientAdsCount,
      remainingTotalSlots: monitorResponse.remainingTotalSlots,
      remainingPartnerSlots: monitorResponse.remainingPartnerSlots,
      remainingClientSlots: monitorResponse.remainingClientSlots,
      availableAdsCount: monitorResponse.availableAdsCount,
    };
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem(this.storageName);
    return new HttpHeaders({
      Authorization: `Bearer ${token || ""}`,
    });
  }

  private requireIncidentPayload(data: IncidentApiDto | undefined): IncidentApiDto {
    if (data == null || typeof data !== "object") {
      throw new Error("Invalid incident response payload");
    }
    return data;
  }

  private mapIncidentToAlert(inc: IncidentApiDto): IMonitorAlert {
    const midRaw = inc.monitorId ?? inc.boxId;
    const mid =
      midRaw != null && String(midRaw).length > 0
        ? String(midRaw)
        : "unknown";
    return {
      id: String(inc.id ?? ""),
      monitorId: mid,
      title: String(inc.incidentType ?? "Incident"),
      description: this.formatIncidentDescription(inc),
      timestamp: inc.openedAt
        ? new Date(inc.openedAt)
        : new Date(),
      status: this.mapIncidentToStatus(inc),
      deviceId: mid,
      acknowledgeReason: inc.acknowledgeReason ?? undefined,
    };
  }

  private mapIncidentToStatus(inc: IncidentApiDto): IMonitorAlert["status"] {
    if (inc.closedAt) {
      return "resolved";
    }
    if (inc.acknowledgedAt) {
      return "acknowledged";
    }
    return this.mapSeverityToAlertStatus(String(inc.severity ?? ""));
  }

  private formatIncidentDescription(inc: IncidentApiDto): string {
    const parts: string[] = [];
    const sev = inc.severity;
    const typ = inc.incidentType;
    if (sev) parts.push(String(sev));
    if (typ) parts.push(String(typ));
    const det = inc.detailsJson;
    if (det && typeof det === "object") {
      try {
        parts.push(JSON.stringify(det));
      } catch {
        /* ignore */
      }
    }
    return parts.join(" · ") || "—";
  }

  private mapSeverityToAlertStatus(
    severity: string
  ): IMonitorAlert["status"] {
    switch (severity.toUpperCase()) {
      case "CRITICAL":
        return "critical";
      case "WARNING":
        return "warning";
      case "INFO":
        return "warning";
      default:
        return "warning";
    }
  }
}
