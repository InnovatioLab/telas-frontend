import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import {
  CreateMonitorRequestDto,
  UpdateMonitorRequestDto,
} from "@app/model/dto/request/create-monitor.request.dto";
import { FilterMonitorRequestDto } from "@app/model/dto/request/filter-monitor.request.dto";
import { MonitorResponseDto } from "@app/model/dto/response/monitor-response.dto";
import { PaginationResponseDto } from "@app/model/dto/response/pagination-response.dto";
import { ResponseDto } from "@app/model/dto/response/response.dto";
import { Monitor } from "@app/model/monitors";
import { Observable, of } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { environment } from "src/environments/environment";
import { IMonitorAlert } from "./interfaces/monitor";

@Injectable({
  providedIn: "root",
})
export class MonitorService {
  private readonly apiUrl = environment.apiUrl + "monitors";
  storageName = "telas_token";
  token = localStorage.getItem(this.storageName);

  headers = {
    headers: {
      Authorization: `Bearer ${this.token}`,
    },
  };

  constructor(private readonly http: HttpClient) {}

  getMonitors(filters?: FilterMonitorRequestDto): Observable<Monitor[]> {
    let params = new HttpParams();

    if (filters) {
      if (filters.page) params = params.set("page", filters.page.toString());
      if (filters.size) params = params.set("size", filters.size.toString());
      if (filters.sortBy) params = params.set("sortBy", filters.sortBy);
      if (filters.sortDir) params = params.set("sortDir", filters.sortDir);
      if (filters.genericFilter)
        params = params.set("genericFilter", filters.genericFilter);
    }

    return this.http
      .get<
        ResponseDto<PaginationResponseDto<MonitorResponseDto>>
      >(`${this.apiUrl}/filters`, { params, ...this.headers })
      .pipe(
        map(
          (
            response: ResponseDto<PaginationResponseDto<MonitorResponseDto>>
          ) => {
            if (response?.data?.list) {
              const mappedList = response.data.list.map(
                this.mapMonitorResponseToMonitor
              );
              return mappedList;
            }
            return [];
          }
        ),
        catchError((error) => {
          return of([]);
        })
      );
  }

  getMonitorsWithPagination(
    filters?: FilterMonitorRequestDto
  ): Observable<PaginationResponseDto<Monitor>> {
    let params = new HttpParams();

    if (filters) {
      if (filters.page) params = params.set("page", filters.page.toString());
      if (filters.size) params = params.set("size", filters.size.toString());
      if (filters.sortBy) params = params.set("sortBy", filters.sortBy);
      if (filters.sortDir) params = params.set("sortDir", filters.sortDir);
      if (filters.genericFilter)
        params = params.set("genericFilter", filters.genericFilter);
    }

    params = params.set("_t", Date.now().toString());

    return this.http
      .get<
        ResponseDto<PaginationResponseDto<MonitorResponseDto>>
      >(`${this.apiUrl}/filters`, { params })
      .pipe(
        map(
          (
            response: ResponseDto<PaginationResponseDto<MonitorResponseDto>>
          ) => {
            if (response?.data) {
              const mappedList = response.data.list.map(
                this.mapMonitorResponseToMonitor
              );
              return {
                ...response.data,
                list: mappedList,
              };
            }
            throw new Error("API não retornou dados dos monitores");
          }
        ),
        catchError((error) => {
          throw error;
        })
      );
  }

  getMonitorById(id: string): Observable<Monitor | null> {
    return this.http
      .get<
        ResponseDto<MonitorResponseDto>
      >(`${this.apiUrl}/${id}`, this.headers)
      .pipe(
        map((response: ResponseDto<MonitorResponseDto>) => {
          if (response?.data) {
            const mappedMonitor = this.mapMonitorResponseToMonitor(
              response.data
            );
            return mappedMonitor;
          }
          return null;
        }),
        catchError((error) => {
          return of(null);
        })
      );
  }

  createMonitor(monitorRequest: CreateMonitorRequestDto): Observable<Monitor> {
    return this.http
      .post<
        ResponseDto<MonitorResponseDto>
      >(this.apiUrl, monitorRequest, this.headers)
      .pipe(
        map((response: ResponseDto<MonitorResponseDto>) => {
          if (response?.data) {
            const mappedMonitor = this.mapMonitorResponseToMonitor(
              response.data
            );
            return mappedMonitor;
          }
          throw new Error("API não retornou dados do monitor criado");
        }),
        catchError((error) => {
          throw error;
        })
      );
  }

  updateMonitor(
    id: string,
    monitorRequest: UpdateMonitorRequestDto
  ): Observable<boolean> {
    return this.http
      .put<
        ResponseDto<void>
      >(`${this.apiUrl}/${id}`, monitorRequest, this.headers)
      .pipe(
        map((response: ResponseDto<any>) => {
          if (response) {
            return true;
          }
          return false;
        }),
        catchError((error) => {
          return of(false);
        })
      );
  }

  deleteMonitor(id: string): Observable<boolean> {
    return this.http
      .delete<ResponseDto<any>>(`${this.apiUrl}/${id}`, this.headers)
      .pipe(
        map((response: ResponseDto<any>) => {
          return true;
        }),
        catchError((error) => {
          return of(false);
        })
      );
  }

  canDeleteMonitor(monitor: Monitor): boolean {
    return true;
  }

  getDeleteRestrictionReason(monitor: Monitor): string | null {
    return null;
  }

  private mapMonitorResponseToMonitor(
    monitorResponse: MonitorResponseDto
  ): Monitor {
    const mappedMonitor = {
      id: monitorResponse.id,
      size: monitorResponse.size || 0,
      active: monitorResponse.active,
      type: monitorResponse.type,
      locationDescription: monitorResponse.locationDescription,
      fullAddress: monitorResponse.fullAddress,
      address: monitorResponse.address || {
        id: "",
        street: "",
        city: "",
        state: "",
        country: "",
        zipCode: "",
      },
      adLinks: [] as string[],
      createdAt: monitorResponse.createdAt,
      updatedAt: monitorResponse.updatedAt,
    };
    return mappedMonitor;
  }

  getValidAds(monitorId: string): Observable<any[]> {
    return this.http
      .get<
        ResponseDto<any[]>
      >(`${this.apiUrl}/valid-ads/${monitorId}`, this.headers)
      .pipe(
        map((response: ResponseDto<any[]>) => {
          return response.data || [];
        }),
        catchError((error) => {
          return of([]);
        })
      );
  }

  getMonitorAlerts(monitorId?: string): Observable<IMonitorAlert[]> {
    const mockAlerts: IMonitorAlert[] = [
      {
        id: "1",
        monitorId: "1",
        title: "Display Panel Offline",
        description:
          "Display panel #12345 has been offline for more than 24 hours.",
        timestamp: new Date(new Date().getTime() - 2 * 60 * 60 * 1000),
        status: "critical",
        deviceId: "DP-12345",
      },
      {
        id: "2",
        monitorId: "2",
        title: "Connectivity Issues",
        description:
          "Panel #67890 is experiencing intermittent connectivity issues.",
        timestamp: new Date(new Date().getTime() - 5 * 60 * 60 * 1000),
        status: "warning",
        deviceId: "DP-67890",
      },
      {
        id: "3",
        monitorId: "3",
        title: "Power Failure",
        description:
          "Panel #54321 reported power supply issues before going offline.",
        timestamp: new Date(new Date().getTime() - 12 * 60 * 60 * 1000),
        status: "critical",
        deviceId: "DP-54321",
      },
      {
        id: "4",
        monitorId: "1",
        title: "System Reboot Required",
        description:
          "Panel #98765 requires a system reboot to apply security updates.",
        timestamp: new Date(new Date().getTime() - 18 * 60 * 60 * 1000),
        status: "warning",
        deviceId: "DP-98765",
      },
      {
        id: "5",
        monitorId: "2",
        title: "Display Calibration Needed",
        description: "Panel #24680 color calibration is out of expected range.",
        timestamp: new Date(new Date().getTime() - 36 * 60 * 60 * 1000),
        status: "resolved",
        deviceId: "DP-24680",
      },
      {
        id: "6",
        monitorId: "3",
        title: "Network Connection Unstable",
        description:
          "Panel #13579 is experiencing intermittent network connection issues.",
        timestamp: new Date(new Date().getTime() - 8 * 60 * 60 * 1000),
        status: "acknowledged",
        deviceId: "DP-13579",
        acknowledgeReason:
          "Troubleshooting in progress, internet provider issue",
      },
    ];

    if (monitorId) {
      return of(mockAlerts.filter((alert) => alert.monitorId === monitorId));
    }

    return of(mockAlerts);
  }

  acknowledgeAlert(alertId: string, reason: string): Observable<IMonitorAlert> {
    const mockResponse: IMonitorAlert = {
      id: alertId,
      monitorId: "1",
      title: "Alert Acknowledged",
      description: "This alert has been acknowledged by an administrator",
      timestamp: new Date(),
      status: "acknowledged",
      deviceId: "DP-12345",
      acknowledgeReason: reason,
    };

    return of(mockResponse);
  }

  resolveAlert(alertId: string): Observable<IMonitorAlert> {
    const mockResponse: IMonitorAlert = {
      id: alertId,
      monitorId: "1",
      title: "Alert Resolved",
      description: "This alert has been marked as resolved",
      timestamp: new Date(),
      status: "resolved",
      deviceId: "DP-12345",
    };

    return of(mockResponse);
  }
}
