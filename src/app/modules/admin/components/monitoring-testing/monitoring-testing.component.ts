import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import {
  MonitoringTestingRow,
  MonitoringTestingService,
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
  checkingPlugId: string | null = null;

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
          this.toastService.erro("Não tem permissão para ver o overview de monitorização.");
        } else {
          this.toastService.erro("Não foi possível carregar o overview de monitorização.");
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
        return "Sem heartbeat";
      default:
        return status;
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

  plugSummary(row: MonitoringTestingRow): string {
    if (!row.smartPlugId) {
      return "—";
    }
    const mac = row.smartPlugMac?.trim() ?? "";
    const vendor = row.smartPlugVendor?.trim() ?? "";
    if (mac && vendor) {
      return `${mac} · ${vendor}`;
    }
    return mac || vendor || "—";
  }

  testBox(row: MonitoringTestingRow): void {
    this.checkingBoxId = row.boxId;
    this.monitoringTestingService.checkBox(row.boxId).subscribe({
      next: (r) => {
        this.checkingBoxId = null;
        const st = this.heartbeatLabel(r.heartbeatStatus);
        const age =
          r.secondsSinceHeartbeat != null
            ? ` · há ${r.secondsSinceHeartbeat}s`
            : "";
        this.toastService.info(`Box ${row.boxIp ?? row.boxId}: ${st}${age}.`);
        this.load();
      },
      error: () => {
        this.checkingBoxId = null;
        this.toastService.erro("Falha ao verificar heartbeat da box.");
      },
    });
  }

  testPlug(row: MonitoringTestingRow): void {
    if (!row.smartPlugId) {
      return;
    }
    this.checkingPlugId = row.smartPlugId;
    this.monitoringTestingService.testReadSmartPlug(row.smartPlugId).subscribe({
      next: (r) => {
        this.checkingPlugId = null;
        const detail = r.reachable
          ? `reachable=${r.reachable}` +
            (r.powerWatts != null ? ` · ${r.powerWatts} W` : "")
          : (r.errorCode ?? "unreachable");
        this.toastService.sucesso(`Tomada: ${detail}`);
      },
      error: () => {
        this.checkingPlugId = null;
        this.toastService.erro("Falha ao testar leitura da tomada.");
      },
    });
  }

  isCheckingBox(row: MonitoringTestingRow): boolean {
    return this.checkingBoxId === row.boxId;
  }

  isCheckingPlug(row: MonitoringTestingRow): boolean {
    return (
      row.smartPlugId != null && this.checkingPlugId === row.smartPlugId
    );
  }
}
