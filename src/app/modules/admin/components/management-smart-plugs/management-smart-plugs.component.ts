import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { SmartPlugAdminService, SmartPlugHistoryPointDto, SmartPlugOverviewDto } from "@app/core/service/api/smart-plug-admin.service";
import { ToastService } from "@app/core/service/state/toast.service";
import { IconsModule } from "@app/shared/icons/icons.module";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { TagModule } from "primeng/tag";

@Component({
  selector: "app-management-smart-plugs",
  standalone: true,
  imports: [CommonModule, PrimengModule, FormsModule, TagModule, IconsModule],
  templateUrl: "./management-smart-plugs.component.html",
  styleUrls: ["./management-smart-plugs.component.scss"],
})
export class ManagementSmartPlugsComponent implements OnInit {
  loading = false;
  plugs: SmartPlugOverviewDto[] = [];
  search = "";

  historyVisible = false;
  historyLoading = false;
  selected: SmartPlugOverviewDto | null = null;
  history: SmartPlugHistoryPointDto[] = [];

  constructor(
    private readonly smartPlugAdmin: SmartPlugAdminService,
    private readonly toast: ToastService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.smartPlugAdmin.overview().subscribe({
      next: (list) => {
        this.plugs = list ?? [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toast.erro("Could not load smart plugs overview.");
      },
    });
  }

  filtered(): SmartPlugOverviewDto[] {
    const q = this.search.trim().toLowerCase();
    if (!q) {
      return this.plugs;
    }
    return this.plugs.filter((p) => {
      const parts = [
        p.displayName,
        p.macAddress,
        p.vendor,
        p.model,
        p.boxIp,
        p.monitorAddressSummary,
        p.lastSeenIp,
      ]
        .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
        .map((x) => x.toLowerCase());
      return parts.some((x) => x.includes(q));
    });
  }

  openHistory(p: SmartPlugOverviewDto): void {
    this.selected = p;
    this.history = [];
    this.historyVisible = true;
    this.historyLoading = true;
    this.smartPlugAdmin.history(p.id, 400).subscribe({
      next: (rows) => {
        this.history = rows ?? [];
        this.historyLoading = false;
      },
      error: () => {
        this.historyLoading = false;
        this.toast.erro("Could not load smart plug history.");
      },
    });
  }

  closeHistory(): void {
    this.historyVisible = false;
    this.selected = null;
    this.history = [];
  }

  testRead(p: SmartPlugOverviewDto): void {
    this.smartPlugAdmin.testRead(p.id).subscribe({
      next: (r) => {
        if (!r.reachable || (r.errorCode ?? "").trim().length > 0) {
          this.toast.erro(`Plug: ${r.errorCode ?? "unreachable"}`);
          return;
        }
        const bits: string[] = [];
        if (r.relayOn != null) {
          bits.push(`relay=${r.relayOn}`);
        }
        if (r.powerWatts != null) {
          bits.push(`${r.powerWatts} W`);
        }
        if (r.voltageVolts != null) {
          bits.push(`${r.voltageVolts} V`);
        }
        if (r.currentAmperes != null) {
          bits.push(`${r.currentAmperes} A`);
        }
        this.toast.sucesso(bits.length > 0 ? bits.join(" · ") : "OK");
        this.load();
      },
      error: () => {
        this.toast.erro("Failed to read smart plug.");
      },
    });
  }

  formatError(code: string | null | undefined): string {
    const c = (code ?? "").trim();
    if (!c) {
      return "";
    }
    if (c === "missing_host" || c === "invalid_host") {
      return "Aguardando descoberta por MAC (agente da box) ou IP não informado.";
    }
    if (c === "timeout") {
      return "Timeout ao comunicar com a tomada.";
    }
    if (c === "unreachable") {
      return "Tomada inacessível.";
    }
    if (c.startsWith("http_")) {
      return `Sidecar HTTP ${c.replace("http_", "")}`;
    }
    return c;
  }
}

