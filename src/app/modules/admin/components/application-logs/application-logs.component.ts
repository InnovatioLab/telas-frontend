import { CommonModule } from "@angular/common";
import { Component, OnInit, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import {
  ApplicationLogEntry,
  MonitoringLogService,
} from "@app/core/service/api/monitoring-log.service";
import {
  BoxConnectivityProbeRow,
  MonitoringBoxConnectivityService,
} from "@app/core/service/api/monitoring-box-connectivity.service";
import { MonitoringConnectivityProbeSettingsService } from "@app/core/service/api/monitoring-connectivity-probe-settings.service";
import {
  MonitoringSchedulerService,
  SchedulerJobStatus,
} from "@app/core/service/api/monitoring-scheduler.service";
import { Authentication } from "@app/core/service/auth/autenthication";
import { ToastService } from "@app/core/service/state/toast.service";
import { hasMonitoringPermission } from "@app/core/utils/monitoring-permission.util";
import { MonitoringPermission } from "@app/model/monitoring-permission";
import { IconsModule } from "@app/shared/icons/icons.module";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { TableLazyLoadEvent } from "primeng/table";
import { ActivatedRoute } from "@angular/router";
import { SmartPlugLogsComponent } from "../smart-plug-logs/smart-plug-logs.component";

interface SelectOption {
  label: string;
  value: string;
}

@Component({
  selector: "app-application-logs",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PrimengModule,
    IconsModule,
    SmartPlugLogsComponent,
  ],
  templateUrl: "./application-logs.component.html",
  styleUrls: ["./application-logs.component.scss"],
})
export class ApplicationLogsComponent implements OnInit {
  private readonly monitoringLogService = inject(MonitoringLogService);
  private readonly monitoringSchedulerService = inject(MonitoringSchedulerService);
  private readonly monitoringConnectivityProbeSettingsService = inject(
    MonitoringConnectivityProbeSettingsService
  );
  private readonly monitoringBoxConnectivityService = inject(MonitoringBoxConnectivityService);
  private readonly toastService = inject(ToastService);
  private readonly authentication = inject(Authentication);
  private readonly route = inject(ActivatedRoute);

  logs: ApplicationLogEntry[] = [];
  loading = false;
  totalRecords = 0;
  rows = 20;
  first = 0;
  messageDialogVisible = false;
  selectedMessage = "";

  summaryDialogVisible = false;
  selectedSummaryJson = "";

  schedulerJobs: SchedulerJobStatus[] = [];
  schedulerLoading = false;

  probeIntervalSeconds: number | null = null;
  probeSettingsLoading = false;
  probeSettingsSaving = false;

  boxPingRows: BoxConnectivityProbeRow[] = [];
  boxPingLoading = false;

  filterSource = "";
  filterLevel = "";
  filterQ = "";
  filterFrom = "";
  filterTo = "";

  readonly sourceOptions: SelectOption[] = [
    { label: "All sources", value: "" },
    { label: "BOX", value: "BOX" },
    { label: "API", value: "API" },
    { label: "WORKER", value: "WORKER" },
    { label: "EMAIL", value: "EMAIL" },
    { label: "MONITORING", value: "MONITORING" },
    { label: "SMART_PLUG", value: "SMART_PLUG" },
  ];

  readonly levelOptions: SelectOption[] = [
    { label: "All levels", value: "" },
    { label: "ERROR", value: "ERROR" },
    { label: "WARN", value: "WARN" },
    { label: "INFO", value: "INFO" },
    { label: "DEBUG", value: "DEBUG" },
    { label: "TRACE", value: "TRACE" },
  ];

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((qp) => {
      const src = (qp.get("source") ?? "").trim();
      if (src) {
        this.filterSource = src;
      }
      const level = (qp.get("level") ?? "").trim();
      if (level) {
        this.filterLevel = level;
      }
      const q = (qp.get("q") ?? "").trim();
      if (q) {
        this.filterQ = q;
      }
      if (this.canViewLogs()) {
        this.first = 0;
        this.loadPage();
      }
    });
    if (this.hasSchedulerView()) {
      this.loadSchedulerJobs();
    }
    if (this.canConfigureProbeInterval()) {
      this.loadProbeSettings();
    }
    if (this.canViewBoxPingLogs()) {
      this.loadBoxPingRows();
    }
  }

  showLogsSection(): boolean {
    return (
      this.canViewLogs() ||
      this.canViewSmartPlugLogs() ||
      this.canViewScheduler() ||
      this.canViewBoxPingLogs()
    );
  }

  canViewLogs(): boolean {
    const c = this.authentication.client();
    return hasMonitoringPermission(c, MonitoringPermission.MONITORING_LOGS_VIEW);
  }

  canViewSmartPlugLogs(): boolean {
    const c = this.authentication.client();
    return hasMonitoringPermission(c, MonitoringPermission.MONITORING_SMART_PLUG_LOGS_VIEW);
  }

  canViewScheduler(): boolean {
    const c = this.authentication.client();
    return (
      hasMonitoringPermission(c, MonitoringPermission.MONITORING_SCHEDULER_VIEW) ||
      hasMonitoringPermission(
        c,
        MonitoringPermission.MONITORING_CONNECTIVITY_PROBE_SETTINGS
      )
    );
  }

  hasSchedulerView(): boolean {
    const c = this.authentication.client();
    return hasMonitoringPermission(c, MonitoringPermission.MONITORING_SCHEDULER_VIEW);
  }

  canConfigureProbeInterval(): boolean {
    const c = this.authentication.client();
    return hasMonitoringPermission(
      c,
      MonitoringPermission.MONITORING_CONNECTIVITY_PROBE_SETTINGS
    );
  }

  canViewBoxPingLogs(): boolean {
    const c = this.authentication.client();
    return hasMonitoringPermission(c, MonitoringPermission.MONITORING_BOX_PING_VIEW);
  }

  hasAnyBoxPingProbeResult(): boolean {
    return this.boxPingRows.some((r) => r.lastProbeAt != null);
  }

  loadBoxPingRows(refresh = false): void {
    this.boxPingLoading = true;
    const request = refresh
      ? this.monitoringBoxConnectivityService.runProbesNow()
      : this.monitoringBoxConnectivityService.listRows();
    request.subscribe({
      next: (rows) => {
        this.boxPingRows = rows ?? [];
        this.boxPingLoading = false;
      },
      error: (err) => {
        this.boxPingRows = [];
        this.boxPingLoading = false;
        if (err?.status === 403) {
          this.toastService.erro("Sem permissão para ver Box ping logs.");
        }
      },
    });
  }

  onLazyLoad(event: TableLazyLoadEvent): void {
    this.first = event.first ?? 0;
    this.rows = event.rows ?? 20;
    this.loadPage();
  }

  applyFilters(): void {
    this.first = 0;
    this.loadPage();
  }

  levelSeverity(level: string): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" {
    const u = level?.toUpperCase() ?? "";
    if (u === "ERROR") {
      return "danger";
    }
    if (u === "WARN") {
      return "warn";
    }
    if (u === "INFO") {
      return "info";
    }
    return "secondary";
  }

  boxAddressFromMetadata(row: ApplicationLogEntry): string {
    const m = row.metadata;
    if (!m || typeof m !== "object") {
      return "—";
    }
    const v = m["boxAddress"];
    return typeof v === "string" && v.length > 0 ? v : "—";
  }

  openMessageDialog(row: ApplicationLogEntry): void {
    this.selectedMessage = row.message ?? "";
    this.messageDialogVisible = true;
  }

  detailFromMetadata(row: ApplicationLogEntry): string {
    if (row.source === "EMAIL") {
      const m = row.metadata;
      if (m && typeof m === "object") {
        const to = m["recipientEmail"];
        if (typeof to === "string" && to.length > 0) {
          return to;
        }
      }
      return "—";
    }
    return this.boxAddressFromMetadata(row);
  }

  formatSummaryPreview(row: SchedulerJobStatus): string {
    const summary = row.lastRunSummary;
    if (summary == null || typeof summary !== "object") {
      return "—";
    }
    const raw = JSON.stringify(summary);
    if (raw.length <= 120) {
      return raw;
    }
    return `${raw.slice(0, 120)}…`;
  }

  openSummaryDialog(row: SchedulerJobStatus): void {
    const summary = row.lastRunSummary;
    if (summary == null) {
      return;
    }
    try {
      this.selectedSummaryJson = JSON.stringify(summary, null, 2);
    } catch {
      this.selectedSummaryJson = String(summary);
    }
    this.summaryDialogVisible = true;
  }

  formatMs(ms: number | null | undefined): string {
    if (ms == null || Number.isNaN(ms)) {
      return "—";
    }
    if (ms < 1000) {
      return `${ms} ms`;
    }
    return `${(ms / 1000).toFixed(1)} s`;
  }

  saveProbeInterval(): void {
    if (this.probeIntervalSeconds == null || Number.isNaN(this.probeIntervalSeconds)) {
      return;
    }
    const sec = Math.round(this.probeIntervalSeconds);
    const ms = sec * 1000;
    if (sec < 5 || sec > 86400) {
      this.toastService.erro("Interval must be between 5 and 86400 seconds.");
      return;
    }
    this.probeSettingsSaving = true;
    this.monitoringConnectivityProbeSettingsService.updateSettings(ms).subscribe({
      next: () => {
        this.probeSettingsSaving = false;
        this.toastService.sucesso("Connectivity probe interval updated.");
        if (this.hasSchedulerView()) {
          this.loadSchedulerJobs();
        }
      },
      error: (err) => {
        this.probeSettingsSaving = false;
        if (err?.status === 403) {
          this.toastService.erro("Sem permissão para alterar o intervalo da sonda.");
        } else {
          this.toastService.erro("Não foi possível guardar o intervalo.");
        }
      },
    });
  }

  private loadProbeSettings(): void {
    this.probeSettingsLoading = true;
    this.monitoringConnectivityProbeSettingsService.getSettings().subscribe({
      next: (s) => {
        this.probeIntervalSeconds = Math.round(s.intervalMs / 1000);
        this.probeSettingsLoading = false;
      },
      error: (err) => {
        this.probeSettingsLoading = false;
        if (err?.status === 403) {
          this.toastService.erro("Sem permissão para ver as definições da sonda.");
        }
      },
    });
  }

  private loadSchedulerJobs(): void {
    this.schedulerLoading = true;
    this.monitoringSchedulerService.listJobs().subscribe({
      next: (list) => {
        this.schedulerJobs = list ?? [];
        this.schedulerLoading = false;
      },
      error: (err) => {
        this.schedulerJobs = [];
        this.schedulerLoading = false;
        if (err?.status === 403) {
          this.toastService.erro("You do not have permission to view scheduled jobs.");
        }
      },
    });
  }

  private loadPage(): void {
    if (!this.canViewLogs()) {
      return;
    }
    this.loading = true;
    const page = Math.floor(this.first / this.rows);
    this.monitoringLogService
      .getLogs({
        page,
        size: this.rows,
        source: this.filterSource.trim() || undefined,
        level: this.filterLevel.trim() || undefined,
        q: this.filterQ.trim() || undefined,
        from: this.filterFrom.trim() || undefined,
        to: this.filterTo.trim() || undefined,
      })
      .subscribe({
        next: (res) => {
          this.logs = res.list ?? [];
          this.totalRecords = res.totalRecords ?? 0;
          this.loading = false;
        },
        error: (err) => {
          this.logs = [];
          this.totalRecords = 0;
          this.loading = false;
          if (err?.status === 403) {
            this.toastService.erro("You do not have permission to view logs.");
          }
        },
      });
  }
}
