import { HttpErrorResponse } from "@angular/common/http";
import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { ApiErrorHandler } from "@app/core/error/api-error-handler";
import {
  BoxHeartbeatCheckResponse,
  MonitoringTestingRow,
  MonitoringTestingService,
  SmartPlugReadingResponse,
} from "@app/core/service/api/monitoring-testing.service";
import { Authentication } from "@app/core/service/auth/autenthication";
import { ToastService } from "@app/core/service/state/toast.service";
import { hasMonitoringPermission } from "@app/core/utils/monitoring-permission.util";
import { MonitoringPermission } from "@app/model/monitoring-permission";
import { IconsModule } from "@app/shared/icons/icons.module";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { TagModule } from "primeng/tag";

@Component({
  selector: "app-monitoring-testing",
  standalone: true,
  imports: [CommonModule, PrimengModule, IconsModule, TagModule],
  templateUrl: "./monitoring-testing.component.html",
  styleUrls: ["./monitoring-testing.component.scss"],
})
export class MonitoringTestingComponent implements OnInit {
  rows: MonitoringTestingRow[] = [];
  loading = false;
  rowsPerPage = 15;
  checkingBoxId: string | null = null;
  checkingPlugKey: string | null = null;
  enqueueingBoxId: string | null = null;

  constructor(
    private readonly monitoringTestingService: MonitoringTestingService,
    private readonly toastService: ToastService,
    private readonly authentication: Authentication
  ) {}

  canExecuteActions(): boolean {
    return hasMonitoringPermission(
      this.authentication.client(),
      MonitoringPermission.MONITORING_TESTING_EXECUTE
    );
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.monitoringTestingService.getOverview().subscribe({
      next: (data) => {
        this.rows = data;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        if (err?.status === 403) {
          this.toastService.erro("You do not have permission to view the monitoring overview.");
        } else {
          this.toastService.erro("Could not load the monitoring overview.");
        }
      },
    });
  }

  heartbeatLabel(status: string): string {
    switch (status) {
      case "ONLINE":
        return "Online";
      case "STALE":
        return "Stale";
      case "MISSING":
        return "No heartbeat";
      default:
        return status;
    }
  }

  boxScriptVersionLabel(row: MonitoringTestingRow): string {
    const s = row.boxScriptVersionStatus ?? "UNKNOWN";
    switch (s) {
      case "MATCH":
        return "Up to date";
      case "BEHIND":
        return "Behind";
      default:
        return "Unknown";
    }
  }

  boxScriptVersionSeverity(
    row: MonitoringTestingRow
  ): "success" | "warn" | "danger" | "secondary" {
    const s = row.boxScriptVersionStatus ?? "UNKNOWN";
    switch (s) {
      case "MATCH":
        return "success";
      case "BEHIND":
        return "warn";
      default:
        return "secondary";
    }
  }

  heartbeatSeverity(
    row: MonitoringTestingRow
  ): "success" | "warn" | "danger" | "secondary" {
    switch (row.heartbeatStatus) {
      case "ONLINE":
        return "success";
      case "STALE":
        return "warn";
      default:
        return "danger";
    }
  }

  plugSummaryMonitor(row: MonitoringTestingRow): string {
    return this.formatPlugLine(
      row.smartPlugId,
      row.smartPlugMac,
      row.smartPlugVendor
    );
  }

  plugSummaryBox(row: MonitoringTestingRow): string {
    return this.formatPlugLine(
      row.boxSmartPlugId,
      row.boxSmartPlugMac,
      row.boxSmartPlugVendor
    );
  }

  private formatPlugLine(
    id: string | null | undefined,
    mac: string | null | undefined,
    vendor: string | null | undefined
  ): string {
    if (!id) {
      return "—";
    }
    const m = mac?.trim() ?? "";
    const v = vendor?.trim() ?? "";
    if (m && v) {
      return `${m} · ${v}`;
    }
    return m || v || "—";
  }

  enqueueBoxScriptUpdate(row: MonitoringTestingRow): void {
    this.enqueueingBoxId = row.boxId;
    this.monitoringTestingService.enqueueBoxScriptUpdate(row.boxId).subscribe({
      next: () => {
        this.enqueueingBoxId = null;
        this.toastService.sucesso("Box script update queued.");
        this.load();
      },
      error: (err: unknown) => {
        this.enqueueingBoxId = null;
        this.toastService.erro(
          this.httpErrorMessage(err, "Failed to queue box script update.")
        );
      },
    });
  }

  isEnqueueingBox(row: MonitoringTestingRow): boolean {
    return this.enqueueingBoxId === row.boxId;
  }

  testBox(row: MonitoringTestingRow): void {
    this.checkingBoxId = row.boxId;
    this.monitoringTestingService.checkBox(row.boxId).subscribe({
      next: (r) => {
        this.checkingBoxId = null;
        this.toastBoxHeartbeat(row, r);
        this.load();
      },
      error: (err: unknown) => {
        this.checkingBoxId = null;
        this.toastService.erro(this.httpErrorMessage(err, "Failed to verify box heartbeat."));
      },
    });
  }

  testBoxPlug(row: MonitoringTestingRow): void {
    if (!row.boxSmartPlugId) {
      return;
    }
    const key = `${row.boxId}:box:${row.boxSmartPlugId}`;
    this.checkingPlugKey = key;
    this.monitoringTestingService.testReadSmartPlug(row.boxSmartPlugId).subscribe({
      next: (r) => {
        this.checkingPlugKey = null;
        this.toastPlugRead("Plug (box)", r);
      },
      error: (err: unknown) => {
        this.checkingPlugKey = null;
        this.toastService.erro(this.httpErrorMessage(err, "Failed to read smart plug on box."));
      },
    });
  }

  testMonitorPlug(row: MonitoringTestingRow): void {
    if (!row.smartPlugId) {
      return;
    }
    const key = `${row.boxId}:${row.monitorId ?? "nom"}:mon:${row.smartPlugId}`;
    this.checkingPlugKey = key;
    this.monitoringTestingService.testReadSmartPlug(row.smartPlugId).subscribe({
      next: (r) => {
        this.checkingPlugKey = null;
        this.toastPlugRead("Plug (screen)", r);
      },
      error: (err: unknown) => {
        this.checkingPlugKey = null;
        this.toastService.erro(this.httpErrorMessage(err, "Failed to read smart plug on screen."));
      },
    });
  }

  isCheckingBox(row: MonitoringTestingRow): boolean {
    return this.checkingBoxId === row.boxId;
  }

  isCheckingBoxPlug(row: MonitoringTestingRow): boolean {
    if (!row.boxSmartPlugId) {
      return false;
    }
    return (
      this.checkingPlugKey ===
      `${row.boxId}:box:${row.boxSmartPlugId}`
    );
  }

  isCheckingMonitorPlug(row: MonitoringTestingRow): boolean {
    if (!row.smartPlugId) {
      return false;
    }
    return (
      this.checkingPlugKey ===
      `${row.boxId}:${row.monitorId ?? "nom"}:mon:${row.smartPlugId}`
    );
  }

  private toastBoxHeartbeat(
    row: MonitoringTestingRow,
    r: BoxHeartbeatCheckResponse
  ): void {
    const st = this.heartbeatLabel(this.normalizeHeartbeatStatus(r));
    const age =
      r.secondsSinceHeartbeat != null
        ? ` · ${r.secondsSinceHeartbeat}s ago`
        : "";
    const versionHint = this.boxHeartbeatVersionHint(r);
    const msg = `Box ${row.boxIp ?? row.boxId}: ${st}${age}${versionHint}.`;
    const status = this.normalizeHeartbeatStatus(r);
    if (r.heartbeatOnline === true && status === "ONLINE") {
      this.toastService.sucesso(msg);
      return;
    }
    if (status === "STALE") {
      this.toastService.aviso(msg);
      return;
    }
    if (status === "MISSING") {
      this.toastService.aviso(msg);
      return;
    }
    this.toastService.erro(msg);
  }

  private httpErrorMessage(err: unknown, fallback: string): string {
    if (err instanceof HttpErrorResponse) {
      return ApiErrorHandler.handleApiError(err);
    }
    return fallback;
  }

  private boxHeartbeatVersionHint(r: BoxHeartbeatCheckResponse): string {
    const parts: string[] = [];
    if (r.reportedBoxScriptVersion) {
      parts.push(`script ${r.reportedBoxScriptVersion}`);
    }
    if (r.targetBoxScriptVersion) {
      parts.push(`target ${r.targetBoxScriptVersion}`);
    }
    if (r.boxScriptVersionStatus) {
      parts.push(r.boxScriptVersionStatus);
    }
    if (r.reportedGitSha) {
      parts.push(`sha ${r.reportedGitSha}`);
    }
    if (parts.length === 0) {
      return "";
    }
    return ` · ${parts.join(" · ")}`;
  }

  private normalizeHeartbeatStatus(r: BoxHeartbeatCheckResponse): string {
    const raw = (r.heartbeatStatus ?? "").toString().trim().toUpperCase();
    if (raw === "ONLINE" || raw === "STALE" || raw === "MISSING") {
      return raw;
    }
    if (r.heartbeatOnline === true) {
      return "ONLINE";
    }
    return raw.length > 0 ? raw : "MISSING";
  }

  private toastPlugRead(prefix: string, r: SmartPlugReadingResponse): void {
    const errCode =
      r.errorCode != null && String(r.errorCode).trim().length > 0
        ? String(r.errorCode).trim()
        : null;
    if (!r.reachable || errCode != null) {
      const err = errCode ?? "no response";
      this.toastService.erro(`${prefix}: ${err}`);
      return;
    }
    const parts: string[] = [];
    if (r.relayOn != null) {
      parts.push(`relay=${r.relayOn}`);
    }
    if (r.powerWatts != null) {
      parts.push(`${r.powerWatts} W`);
    }
    if (r.voltageVolts != null) {
      parts.push(`${r.voltageVolts} V`);
    }
    const detail = parts.length > 0 ? parts.join(" · ") : "on";
    this.toastService.sucesso(`${prefix}: ${detail}`);
  }
}
