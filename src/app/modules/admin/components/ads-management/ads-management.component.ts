import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { AdminAdOperationsService } from "@app/core/service/api/admin-ad-operations.service";
import { ToastService } from "@app/core/service/state/toast.service";
import { ConfirmationDialogService } from "@app/shared/services/confirmation-dialog.service";
import {
  AdminAdOperationRow,
  AdminAdOperationsFilter,
} from "@app/model/admin-ad-operations";
import { IconsModule } from "@app/shared/icons/icons.module";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { isPdfFile } from "@app/shared/utils/file-type.utils";
import {
  resolveLazyTableRequestPage,
  TableLazyPageEvent,
} from "@app/shared/utils/table-lazy-pagination.utils";

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

  colAdvertiserName = "";
  colPartnerName = "";
  colBoxIp = "";
  colScreenContains = "";
  colSubmissionFrom: Date | null = null;
  colSubmissionTo: Date | null = null;

  previewVisible = false;
  previewTitle = "";
  previewUrl: string | null = null;
  safePdfUrl: SafeResourceUrl | null = null;

  deletingAdId: string | null = null;
  dispatchingAdId: string | null = null;

  constructor(
    private readonly adminAdOperationsService: AdminAdOperationsService,
    private readonly toastService: ToastService,
    private readonly sanitizer: DomSanitizer,
    private readonly confirmationDialogService: ConfirmationDialogService
  ) {}

  ngOnInit(): void {
    this.loadApprovedClientAds();
  }

  private ensureCoherentSubmissionDateRange(): void {
    if (!this.colSubmissionFrom || !this.colSubmissionTo) {
      return;
    }
    if (this.colSubmissionFrom.getTime() <= this.colSubmissionTo.getTime()) {
      return;
    }
    this.toastService.aviso(
      "A data inicial não pode ser maior que a data final. Ajustei automaticamente."
    );
    this.colSubmissionTo = new Date(this.colSubmissionFrom);
  }

  private buildListFilters(): AdminAdOperationsFilter {
    this.ensureCoherentSubmissionDateRange();
    const submissionDateFrom = this.dateToIsoStartUtc(this.colSubmissionFrom);
    const submissionDateTo = this.dateToIsoEndUtc(this.colSubmissionTo);
    return {
      page: this.currentPage,
      size: this.pageSize,
      genericFilter: this.searchTerm,
      validation: "APPROVED",
      sortBy: "submissionDate",
      sortDir: "desc",
      advertiserName: this.colAdvertiserName.trim() || undefined,
      partnerName: this.colPartnerName.trim() || undefined,
      boxIp: this.colBoxIp.trim() || undefined,
      screenContains: this.colScreenContains.trim() || undefined,
      submissionDateFrom,
      submissionDateTo,
    };
  }

  private dateToIsoStartUtc(value: Date | null): string | undefined {
    if (!value) {
      return undefined;
    }
    const d = new Date(
      Date.UTC(
        value.getFullYear(),
        value.getMonth(),
        value.getDate(),
        0,
        0,
        0,
        0
      )
    );
    return d.toISOString();
  }

  private dateToIsoEndUtc(value: Date | null): string | undefined {
    if (!value) {
      return undefined;
    }
    const d = new Date(
      Date.UTC(
        value.getFullYear(),
        value.getMonth(),
        value.getDate(),
        23,
        59,
        59,
        999
      )
    );
    return d.toISOString();
  }

  loadApprovedClientAds(): void {
    this.loading = true;
    this.adminAdOperationsService
      .findPage(this.buildListFilters())
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

  onApplyColumnFilters(): void {
    this.currentPage = 1;
    this.loadApprovedClientAds();
  }

  onClearColumnFilters(): void {
    this.colAdvertiserName = "";
    this.colPartnerName = "";
    this.colBoxIp = "";
    this.colScreenContains = "";
    this.colSubmissionFrom = null;
    this.colSubmissionTo = null;
    this.currentPage = 1;
    this.loadApprovedClientAds();
  }

  onPageChange(event: TableLazyPageEvent): void {
    const { page, rows } = resolveLazyTableRequestPage(event, this.pageSize);
    this.currentPage = page;
    this.pageSize = rows;
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

  isDeleting(row: AdminAdOperationRow): boolean {
    return this.deletingAdId === row.adId;
  }

  isDispatching(row: AdminAdOperationRow): boolean {
    return this.dispatchingAdId === row.adId;
  }

  canDispatchToBox(row: AdminAdOperationRow): boolean {
    const monitorId = row.monitorId?.trim();
    return !!monitorId && !this.isSentToBox(row);
  }

  manageAdsLink(row: AdminAdOperationRow): string[] | null {
    const monitorId = row.monitorId?.trim();
    if (!monitorId) {
      return null;
    }
    return ["/admin/screens", monitorId, "manage-ads"];
  }

  async dispatchToBox(row: AdminAdOperationRow): Promise<void> {
    const adId = row.adId?.trim();
    if (!adId) {
      return;
    }
    const adName = row.adName?.trim() || "this ad";
    const confirmed = await this.confirmationDialogService.confirm({
      title: "Send to screen",
      message: `Stage "${adName}" on the target box for publication?`,
      confirmLabel: "Send",
    });
    if (!confirmed) {
      return;
    }
    this.dispatchingAdId = adId;
    this.adminAdOperationsService.dispatchAdToBox(adId).subscribe({
      next: () => {
        this.toastService.sucesso("Ad sent to screen.");
        this.dispatchingAdId = null;
        this.loadApprovedClientAds();
      },
      error: () => {
        this.dispatchingAdId = null;
        this.toastService.erro("Failed to send ad to screen");
      },
    });
  }

  async deleteAd(row: AdminAdOperationRow): Promise<void> {
    const adId = row.adId?.trim();
    if (!adId) {
      return;
    }
    const adName = row.adName?.trim() || "this ad";
    const onScreen = this.isSentToBox(row);
    const message = onScreen
      ? `Delete "${adName}"? It is on a screen or box and will be removed from playback permanently.`
      : `Delete "${adName}"? This action cannot be undone.`;
    const confirmed = await this.confirmationDialogService.confirm({
      title: "Delete ad",
      message,
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      severity: "warn",
    });
    if (!confirmed) {
      return;
    }
    this.deletingAdId = adId;
    this.adminAdOperationsService.deleteAd(adId).subscribe({
      next: () => {
        this.toastService.sucesso("Ad deleted.");
        this.deletingAdId = null;
        this.loadApprovedClientAds();
      },
      error: () => {
        this.deletingAdId = null;
      },
    });
  }
}
