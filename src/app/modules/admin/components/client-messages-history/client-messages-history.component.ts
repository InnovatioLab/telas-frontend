import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { ClientManagementService } from "@app/core/service/api/client-management.service";
import { ClientService } from "@app/core/service/api/client.service";
import { ToastService } from "@app/core/service/state/toast.service";
import { AdminClientMessageRowDto } from "@app/model/dto/response/admin-client-message-row.dto";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { Client } from "@app/model/client";

type GroupedMessages = {
  adId: string;
  adName: string;
  rows: AdminClientMessageRowDto[];
};

@Component({
  selector: "app-client-messages-history",
  standalone: true,
  imports: [CommonModule, PrimengModule, RouterModule, ProgressSpinnerModule],
  templateUrl: "./client-messages-history.component.html",
  styleUrls: ["./client-messages-history.component.scss"],
})
export class ClientMessagesHistoryComponent implements OnInit {
  clientId = "";
  clientName = "";
  clientEmail = "";
  loading = false;
  rows: AdminClientMessageRowDto[] = [];
  grouped: GroupedMessages[] = [];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly clientManagementService: ClientManagementService,
    private readonly clientService: ClientService,
    private readonly toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.clientId = this.route.snapshot.paramMap.get("clientId") || "";
    if (!this.clientId) {
      this.toastService.erro("Client not found.");
      return;
    }
    this.loadClientHeader();
    this.load();
  }

  private loadClientHeader(): void {
    this.clientService.buscarClient<Client>(this.clientId).subscribe({
      next: (c) => {
        this.clientName = String(c?.businessName ?? "");
        this.clientEmail = String(c?.contact?.email ?? "");
      },
      error: () => {
        this.clientName = "";
        this.clientEmail = "";
      },
    });
  }

  load(): void {
    this.loading = true;
    this.clientManagementService.listClientMessagesHistory(this.clientId).subscribe({
      next: (list) => {
        this.rows = list ?? [];
        this.grouped = this.groupByAd(this.rows);
        this.loading = false;
      },
      error: () => {
        this.toastService.erro("Failed to load message history.");
        this.loading = false;
      },
    });
  }

  private groupByAd(rows: AdminClientMessageRowDto[]): GroupedMessages[] {
    const map = new Map<string, GroupedMessages>();
    for (const r of rows) {
      const adId = String(r.adId ?? "unknown");
      const adName = String(r.adName ?? "Unknown ad");
      const key = `${adId}`;
      const current = map.get(key) ?? { adId, adName, rows: [] };
      current.rows.push(r);
      map.set(key, current);
    }
    return Array.from(map.values());
  }
}

