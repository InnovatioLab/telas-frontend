import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Inject, Injectable } from "@angular/core";
import {
  CreateMonitorRequestDto,
  UpdateMonitorRequestDto,
} from "@app/model/dto/request/create-monitor.request.dto";
import { FilterMonitorRequestDto } from "@app/model/dto/request/filter-monitor.request.dto";
import { PaginationResponseDto } from "@app/model/dto/response/pagination-response.dto";
import { Monitor } from "@app/model/monitors";
import { Observable, of } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { IMonitorRepository } from "@app/core/interfaces/services/repository/monitor-repository.interface";
import { MONITOR_REPOSITORY_TOKEN } from "@app/core/tokens/injection-tokens";
import { IMonitorAlert } from "./interfaces/monitor";
import { IncidentApiDto } from "./interfaces/incident-api";
import { ENVIRONMENT } from "src/environments/environment-token";
import { Environment } from "src/environments/environment.interface";

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

  getValidAds(monitorId: string): Observable<any[]> {
    return this.repository.findValidAds(monitorId);
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
