import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { AdminAdOperationsService } from "@app/core/service/api/admin-ad-operations.service";
import { ToastService } from "@app/core/service/state/toast.service";
import { AdminAdOperationRow } from "@app/model/admin-ad-operations";
import { IconsModule } from "@app/shared/icons/icons.module";
import { PrimengModule } from "@app/shared/primeng/primeng.module";

@Component({
  selector: "app-ads-management",
  standalone: true,
  imports: [CommonModule, PrimengModule, FormsModule, IconsModule, RouterModule],
  templateUrl: "./ads-management.component.html",
  styleUrls: ["./ads-management.component.scss"],
})
export class AdsManagementComponent implements OnInit {
  approvedRows: AdminAdOperationRow[] = [];
  loading = false;
  searchTerm = "";
  totalRecords = 0;
  currentPage = 1;
  pageSize = 10;

  constructor(
    private readonly adminAdOperationsService: AdminAdOperationsService,
    private readonly toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadApprovedClientAds();
  }

  loadApprovedClientAds(): void {
    this.loading = true;
    this.adminAdOperationsService
      .findPage({
        page: this.currentPage,
        size: this.pageSize,
        genericFilter: this.searchTerm,
        validation: "APPROVED",
        sortBy: "adName",
        sortDir: "asc",
      })
      .subscribe({
        next: (response) => {
          this.approvedRows = response.list ?? [];
          this.totalRecords =
            response.totalRecords ?? response.totalElements ?? 0;
          this.loading = false;
        },
        error: () => {
          this.toastService.erro("Failed to load client-approved ads");
          this.loading = false;
        },
      });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadApprovedClientAds();
  }

  onPageChange(event: { first: number; rows: number }): void {
    this.currentPage = Math.floor(event.first / event.rows) + 1;
    this.pageSize = event.rows;
    this.loadApprovedClientAds();
  }

  isSentToBox(row: AdminAdOperationRow): boolean {
    const ip = row.boxIp?.trim();
    if (ip) {
      return true;
    }
    const stage = row.operationalStage ?? "";
    return stage === "IN_BOX" || stage === "ON_AIR" || stage === "ON_AIR_OPEN_ENDED";
  }

  sentToBoxLabel(row: AdminAdOperationRow): string {
    return this.isSentToBox(row) ? "Yes" : "No";
  }

  screenTargetSummary(row: AdminAdOperationRow): string {
    const parts: string[] = [];
    if (row.partnerBusinessName?.trim()) {
      parts.push(row.partnerBusinessName.trim());
    }
    if (
      row.screenAddressSummary?.trim() &&
      row.screenAddressSummary !== "Not on a screen yet"
    ) {
      parts.push(row.screenAddressSummary.trim());
    }
    if (row.boxIp?.trim()) {
      parts.push(`Box ${row.boxIp.trim()}`);
    }
    if (parts.length === 0) {
      return "—";
    }
    return parts.join(" · ");
  }
}
