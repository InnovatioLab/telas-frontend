import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { AdminAdOperationsService } from "@app/core/service/api/admin-ad-operations.service";
import { ToastService } from "@app/core/service/state/toast.service";
import { AdminAdOperationRow } from "@app/model/admin-ad-operations";
import { IconsModule } from "@app/shared/icons/icons.module";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { isPdfFile } from "@app/shared/utils/file-type.utils";

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

  previewVisible = false;
  previewTitle = "";
  previewUrl: string | null = null;
  safePdfUrl: SafeResourceUrl | null = null;

  constructor(
    private readonly adminAdOperationsService: AdminAdOperationsService,
    private readonly toastService: ToastService,
    private readonly sanitizer: DomSanitizer
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

  openPreview(row: AdminAdOperationRow): void {
    const url = row.adLink?.trim();
    if (!url) {
      this.toastService.erro("No preview link available for this ad.");
      return;
    }
    this.previewTitle = row.adName?.trim() || "Ad";
    this.previewUrl = url;
    const pdf =
      isPdfFile(url, row.adName) ||
      (row.adMediaType?.toLowerCase().includes("pdf") ?? false);
    this.safePdfUrl = pdf
      ? this.sanitizer.bypassSecurityTrustResourceUrl(url)
      : null;
    this.previewVisible = true;
  }

  closePreview(): void {
    this.previewVisible = false;
    this.previewUrl = null;
    this.safePdfUrl = null;
    this.previewTitle = "";
  }

  openPreviewInNewTab(): void {
    if (this.previewUrl) {
      window.open(this.previewUrl, "_blank", "noopener,noreferrer");
    }
  }
}
