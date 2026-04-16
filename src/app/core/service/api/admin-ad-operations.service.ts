import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { environment } from "src/environments/environment";
import { ResponseDTO } from "@app/model/dto/response.dto";
import {
  AdminAdOperationRow,
  AdminAdOperationsFilter,
  AdminExpiryNotification,
} from "@app/model/admin-ad-operations";
import { PaginationResponseDto } from "@app/model/dto/response/pagination-response.dto";

@Injectable({ providedIn: "root" })
export class AdminAdOperationsService {
  private readonly baseUrl = `${environment.apiUrl}admin/ad-operations`;
  private readonly storageName = "telas_token";

  constructor(private readonly http: HttpClient) {}

  findPage(
    filters: AdminAdOperationsFilter
  ): Observable<PaginationResponseDto<AdminAdOperationRow>> {
    let params = new HttpParams();
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
    if (filters.genericFilter?.trim()) {
      params = params.set("genericFilter", filters.genericFilter.trim());
    }
    if (filters.validation) {
      params = params.set("validation", filters.validation);
    }
    params = params.set("_t", String(Date.now()));
    return this.http
      .get<
        ResponseDTO<PaginationResponseDto<AdminAdOperationRow>>
      >(`${this.baseUrl}`, { ...this.getJsonHeaders(), params })
      .pipe(
        map((r) => {
          const payload = (r as { data?: PaginationResponseDto<AdminAdOperationRow> }).data;
          if (!payload) {
            throw new Error("Resposta sem dados");
          }
          return this.unwrapPagination(payload);
        })
      );
  }

  listExpiryNotifications(
    advertiserId: string
  ): Observable<AdminExpiryNotification[]> {
    return this.http
      .get<ResponseDTO<AdminExpiryNotification[]>>(
        `${this.baseUrl}/clients/${advertiserId}/expiry-notifications`,
        this.getJsonHeaders()
      )
      .pipe(
        map((r) => {
          const d = (r as { data?: AdminExpiryNotification[] }).data;
          return d ?? [];
        })
      );
  }

  downloadSubscriptionsCsv(): Observable<Blob> {
    const token = localStorage.getItem(this.storageName);
    const headers = new HttpHeaders({
      Accept: "text/csv",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    });
    return this.http.get(`${this.baseUrl}/export/subscriptions.csv`, {
      headers,
      responseType: "blob",
    });
  }

  private unwrapPagination(
    data: PaginationResponseDto<AdminAdOperationRow>
  ): PaginationResponseDto<AdminAdOperationRow> {
    const total =
      data.totalRecords ?? data.totalElements ?? (data.list?.length ?? 0);
    return {
      ...data,
      totalElements: total,
      totalRecords: total,
      list: data.list ?? [],
    };
  }

  private getJsonHeaders(): { headers: HttpHeaders } {
    const token = localStorage.getItem(this.storageName);
    const headers = new HttpHeaders({
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    });
    return { headers };
  }

}
