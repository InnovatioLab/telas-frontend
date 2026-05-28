import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Inject, Injectable } from "@angular/core";
import { PARTNER_API } from "@app/core/constants/partner-api.paths";
import { MonitorResponseMapper } from "@app/core/service/mapper/monitor-response.mapper";
import { AttachmentRequestDto } from "@app/model/dto/request/attachment-request.dto";
import { FilterBoxRequestDto } from "@app/model/dto/request/filter-box-request.dto";
import { PartnerAdSubmissionRequestDto } from "@app/model/dto/request/partner-ad-submission.request.dto";
import {
  AdRequestResponseDto,
} from "@app/model/dto/response/ad-request-response.dto";
import { MonitorResponseDto } from "@app/model/dto/response/monitor-response.dto";
import { PaginationResponseDto } from "@app/model/dto/response/pagination-response.dto";
import { Monitor } from "@app/model/monitors";
import { Observable, of } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { ENVIRONMENT } from "src/environments/environment-token";
import { Environment } from "src/environments/environment.interface";

interface ApiEnvelope<T> {
  data?: T;
}

interface ResponseDto<T> {
  data?: T;
}

@Injectable({
  providedIn: "root",
})
export class PartnerPortalService {
  private readonly storageName = "telas_token";

  constructor(
    private readonly http: HttpClient,
    @Inject(ENVIRONMENT) private readonly env: Environment,
    private readonly monitorResponseMapper: MonitorResponseMapper
  ) {}

  getMyScreens(): Observable<Monitor[]> {
    return this.http
      .get<ApiEnvelope<MonitorResponseDto[]>>(
        `${this.env.apiUrl}${PARTNER_API.monitors.myScreens}`,
        { headers: this.authHeaders() }
      )
      .pipe(
        map((res) => {
          const list = Array.isArray(res?.data) ? res.data : [];
          return list.map((dto) => this.monitorResponseMapper.toMonitor(dto));
        }),
        catchError(() => of([]))
      );
  }

  getPlacementTarget(monitorId: string): Observable<Monitor> {
    return this.http
      .get<ApiEnvelope<MonitorResponseDto>>(
        `${this.env.apiUrl}${PARTNER_API.monitors.placementTarget(monitorId)}`,
        { headers: this.authHeaders() }
      )
      .pipe(
        map((res) => {
          const dto = res?.data;
          if (!dto?.id) {
            throw new Error("Monitor not found");
          }
          return this.monitorResponseMapper.toMonitor(dto);
        })
      );
  }

  submitAdSubmission(
    monitorId: string,
    payload: PartnerAdSubmissionRequestDto
  ): Observable<string> {
    return this.http
      .post<ApiEnvelope<string>>(
        `${this.env.apiUrl}${PARTNER_API.monitors.submit(monitorId)}`,
        payload,
        { headers: this.authHeaders() }
      )
      .pipe(map((res) => String(res?.data ?? "")));
  }

  uploadDirectAdToMonitor(
    monitorId: string,
    payload: AttachmentRequestDto
  ): Observable<string> {
    return this.http
      .post<ApiEnvelope<string>>(
        `${this.env.apiUrl}${PARTNER_API.monitors.directAd(monitorId)}`,
        payload,
        { headers: this.authHeaders() }
      )
      .pipe(map((res) => String(res?.data ?? "")));
  }

  getMyAdRequests(
    filters?: FilterBoxRequestDto
  ): Observable<PaginationResponseDto<AdRequestResponseDto>> {
    let params = new HttpParams();
    if (filters) {
      if (filters.page != null) {
        params = params.set("page", String(filters.page));
      }
      if (filters.size != null) {
        params = params.set("size", String(filters.size));
      }
      if (filters.sortBy) {
        params = params.set("sortBy", filters.sortBy);
      }
      if (filters.sortDir) {
        params = params.set("sortDir", filters.sortDir);
      }
      if (filters.genericFilter) {
        params = params.set("genericFilter", filters.genericFilter);
      }
    }

    return this.http
      .get<ResponseDto<PaginationResponseDto<AdRequestResponseDto>>>(
        `${this.env.apiUrl}${PARTNER_API.clients.partnerAdRequests}`,
        { headers: this.authHeaders(), params }
      )
      .pipe(
        map((response) => {
          if (response.data) {
            return {
              list: response.data.list ?? [],
              totalElements:
                response.data.totalElements && response.data.totalElements > 0
                  ? response.data.totalElements
                  : (response.data.list?.length ?? 0),
              totalPages: response.data.totalPages ?? 0,
              currentPage: response.data.currentPage ?? 0,
              size: response.data.size ?? 0,
              hasNext: response.data.hasNext ?? false,
              hasPrevious: response.data.hasPrevious ?? false,
            };
          }
          return {
            list: [],
            totalElements: 0,
            totalPages: 0,
            currentPage: 0,
            size: 0,
            hasNext: false,
            hasPrevious: false,
          };
        })
      );
  }

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem(this.storageName);
    return new HttpHeaders({
      Authorization: `Bearer ${token || ""}`,
    });
  }
}
