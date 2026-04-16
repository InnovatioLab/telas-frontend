import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { FormsModule } from "@angular/forms";
import {
  ApplicationLogEntry,
  MonitoringLogService,
} from "@app/core/service/api/monitoring-log.service";
import { ToastService } from "@app/core/service/state/toast.service";
import { IconsModule } from "@app/shared/icons/icons.module";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { TableLazyLoadEvent } from "primeng/table";

interface SelectOption {
  label: string;
  value: string;
}

@Component({
  selector: "app-application-logs",
  standalone: true,
  imports: [CommonModule, FormsModule, PrimengModule, IconsModule],
  templateUrl: "./application-logs.component.html",
  styleUrls: ["./application-logs.component.scss"],
})
export class ApplicationLogsComponent {
  logs: ApplicationLogEntry[] = [];
  loading = false;
  totalRecords = 0;
  rows = 20;
  first = 0;
  messageDialogVisible = false;
  selectedMessage = "";

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
  ];

  readonly levelOptions: SelectOption[] = [
    { label: "All levels", value: "" },
    { label: "ERROR", value: "ERROR" },
    { label: "WARN", value: "WARN" },
    { label: "INFO", value: "INFO" },
    { label: "DEBUG", value: "DEBUG" },
    { label: "TRACE", value: "TRACE" },
  ];

  constructor(
    private readonly monitoringLogService: MonitoringLogService,
    private readonly toastService: ToastService
  ) {}

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

  private loadPage(): void {
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
