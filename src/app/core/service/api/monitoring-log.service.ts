import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { ResponseDto } from "@app/model/dto/response/response.dto";
import { PaginationResponseDto } from "@app/model/dto/response/pagination-response.dto";
import { Authentication } from "@app/core/service/auth/autenthication";
import { AuthenticationStorage } from "@app/core/service/auth/authentication-storage";
import { ENVIRONMENT } from "src/environments/environment-token";
import { Environment } from "src/environments/environment.interface";

export interface ApplicationLogEntry {
  id: string;
  createdAt: string;
  level: string;
  message: string;
  source: string;
  correlationId?: string | null;
  stackTrace?: string | null;
  endpoint?: string | null;
  clientId?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface MonitoringLogQuery {
  page?: number;
  size?: number;
  source?: string;
  level?: string;
  q?: string;
  from?: string;
  to?: string;
}

@Injectable({
  providedIn: "root",
})
export class MonitoringLogService {
  constructor(
    private readonly http: HttpClient,
    @Inject(ENVIRONMENT) private readonly env: Environment,
    private readonly authentication: Authentication
  ) {}

  getLogs(query: MonitoringLogQuery): Observable<PaginationResponseDto<ApplicationLogEntry>> {
    const page = query.page ?? 0;
    const size = query.size ?? 20;
    let params = new HttpParams()
      .set("page", String(page))
      .set("size", String(size));
    if (query.source?.trim()) {
      params = params.set("source", query.source.trim());
    }
    if (query.level?.trim()) {
      params = params.set("level", query.level.trim());
    }
    if (query.q?.trim()) {
      params = params.set("q", query.q.trim());
    }
    if (query.from?.trim()) {
      params = params.set("from", query.from.trim());
    }
    if (query.to?.trim()) {
      params = params.set("to", query.to.trim());
    }

    return this.http
      .get<ResponseDto<PaginationResponseDto<ApplicationLogEntry>>>(
        `${this.env.apiUrl}monitoring/logs`,
        {
          headers: new HttpHeaders(this.getAuthHeaders()),
          params,
        }
      )
      .pipe(map((res) => this.normalizePagination(res.data)));
  }

  private normalizePagination(
    data: PaginationResponseDto<ApplicationLogEntry> | undefined
  ): PaginationResponseDto<ApplicationLogEntry> {
    const list = data?.list ?? [];
    const totalRecords =
      data?.totalRecords ?? data?.totalElements ?? list.length;
    const totalPages = data?.totalPages ?? 1;
    const currentPage = data?.currentPage ?? 1;
    const size = data?.size ?? list.length;
    return {
      list,
      totalRecords,
      totalElements: totalRecords,
      totalPages,
      currentPage,
      size,
      hasNext: currentPage < totalPages,
      hasPrevious: currentPage > 1,
    };
  }

  private getAuthHeaders(): Record<string, string> {
    const token =
      this.authentication.token ?? AuthenticationStorage.getToken();
    return {
      Authorization: `Bearer ${token || ""}`,
    };
  }
}
