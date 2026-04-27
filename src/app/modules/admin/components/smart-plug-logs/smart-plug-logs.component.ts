import { CommonModule } from "@angular/common";
import { Component, OnInit, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import {
  ApplicationLogEntry,
  MonitoringLogService,
} from "@app/core/service/api/monitoring-log.service";
import { Authentication } from "@app/core/service/auth/autenthication";
import { ToastService } from "@app/core/service/state/toast.service";
import { hasMonitoringPermission } from "@app/core/utils/monitoring-permission.util";
import { MonitoringPermission } from "@app/model/monitoring-permission";
import { IconsModule } from "@app/shared/icons/icons.module";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { TableLazyLoadEvent } from "primeng/table";

interface SelectOption {
  label: string;
  value: string;
}

@Component({
  selector: "app-smart-plug-logs",
  standalone: true,
  imports: [CommonModule, FormsModule, PrimengModule, IconsModule],
  templateUrl: "./smart-plug-logs.component.html",
  styleUrls: ["./smart-plug-logs.component.scss"],
})
export class SmartPlugLogsComponent implements OnInit {
  private readonly monitoringLogService = inject(MonitoringLogService);
  private readonly toastService = inject(ToastService);
  private readonly authentication = inject(Authentication);

  logs: ApplicationLogEntry[] = [];
  loading = false;
  totalRecords = 0;
  rows = 20;
  first = 0;

  messageDialogVisible = false;
  selectedMessage = "";

  filterLevel = "";
  filterQ = "";
  filterFrom = "";
  filterTo = "";

  readonly levelOptions: SelectOption[] = [
    { label: "All levels", value: "" },
    { label: "ERROR", value: "ERROR" },
    { label: "WARN", value: "WARN" },
    { label: "INFO", value: "INFO" },
    { label: "DEBUG", value: "DEBUG" },
    { label: "TRACE", value: "TRACE" },
  ];

  ngOnInit(): void {
    if (this.canView()) {
      this.loadPage();
    }
  }

  canView(): boolean {
    return hasMonitoringPermission(
      this.authentication.client(),
      MonitoringPermission.MONITORING_SMART_PLUG_LOGS_VIEW
    );
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

  openMessageDialog(row: ApplicationLogEntry): void {
    this.selectedMessage = row.message ?? "";
    this.messageDialogVisible = true;
  }

  levelSeverity(
    level: string
  ): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" {
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

  plugDetailFromMetadata(row: ApplicationLogEntry): string {
    const m = row.metadata;
    if (!m || typeof m !== "object") {
      return "—";
    }
    const mac = m["macAddress"];
    const plugId = m["plugId"];
    const parts: string[] = [];
    if (typeof mac === "string" && mac.trim().length > 0) {
      parts.push(mac.trim());
    }
    if (typeof plugId === "string" && plugId.trim().length > 0) {
      parts.push(plugId.trim());
    }
    return parts.length > 0 ? parts.join(" · ") : "—";
  }

  private loadPage(): void {
    if (!this.canView()) {
      return;
    }
    this.loading = true;
    const page = Math.floor(this.first / this.rows);
    this.monitoringLogService
      .getLogs({
        page,
        size: this.rows,
        source: "SMART_PLUG",
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
            this.toastService.erro("Sem permissão para ver smart plug logs.");
          } else {
            this.toastService.erro("Não foi possível carregar smart plug logs.");
          }
        },
      });
  }
}

