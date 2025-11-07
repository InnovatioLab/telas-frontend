import { Injectable, Inject } from "@angular/core";
import {
  CreateMonitorRequestDto,
  UpdateMonitorRequestDto,
} from "@app/model/dto/request/create-monitor.request.dto";
import { FilterMonitorRequestDto } from "@app/model/dto/request/filter-monitor.request.dto";
import { PaginationResponseDto } from "@app/model/dto/response/pagination-response.dto";
import { Monitor } from "@app/model/monitors";
import { Observable, of } from "rxjs";
import { IMonitorRepository } from "@app/core/interfaces/services/repository/monitor-repository.interface";
import { MONITOR_REPOSITORY_TOKEN } from "@app/core/tokens/injection-tokens";
import { IMonitorAlert } from "./interfaces/monitor";

@Injectable({
  providedIn: "root",
})
export class MonitorService {
  constructor(
    @Inject(MONITOR_REPOSITORY_TOKEN) 
    private readonly repository: IMonitorRepository
  ) {}

  getMonitorsWithPagination(filters?: FilterMonitorRequestDto): Observable<PaginationResponseDto<Monitor>> {
    return this.repository.findWithPagination(filters);
  }

  getMonitorById(id: string): Observable<Monitor | null> {
    return this.repository.findById(id);
  }

  createMonitor(monitorRequest: CreateMonitorRequestDto): Observable<boolean> {
    return this.repository.create(monitorRequest);
  }

  updateMonitor(id: string, monitorRequest: UpdateMonitorRequestDto): Observable<boolean> {
    return this.repository.update(id, monitorRequest);
  }

  deleteMonitor(id: string): Observable<boolean> {
    return this.repository.delete(id);
  }

  getValidAds(monitorId: string): Observable<any[]> {
    return this.repository.findValidAds(monitorId);
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
