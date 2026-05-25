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
import { LazyTableController, LazyTableFilterState } from "@app/shared/utils/lazy-table.controller";
import { TableLazyPageEvent } from "@app/shared/utils/table-lazy-pagination.utils";
import { map } from "rxjs/operators";

@Component({
  selector: "app-ads-management",
  standalone: true,
  imports: [CommonModule, PrimengModule, FormsModule, IconsModule, RouterModule],
  templateUrl: "./ads-management.component.html",
  styleUrls: ["./ads-management.component.scss"],
})
export class AdsManagementComponent implements OnInit {
  searchTerm = "";

  readonly tableController: LazyTableController<
    AdminAdOperationRow,
    AdminAdOperationsFilter & LazyTableFilterState
  >;

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
  addingToPlaylistAdId: string | null = null;
  previewLoadingAdId: string | null = null;

  constructor(
    private readonly adminAdOperationsService: AdminAdOperationsService,
    private readonly toastService: ToastService,
    private readonly sanitizer: DomSanitizer,
    private readonly confirmationDialogService: ConfirmationDialogService
  ) {
    this.tableController = new LazyTableController<
      AdminAdOperationRow,
      AdminAdOperationsFilter & LazyTableFilterState
    >(
      {
        page: 1,
        size: 10,
        sortBy: "submissionDate",
        sortDir: "desc",
      },
      (filters) =>
        this.adminAdOperationsService.findPage(this.buildListFilters(filters)).pipe(
          map((response) => ({
            list: response.list ?? [],
            totalElements: response.totalRecords ?? response.totalElements ?? 0,
          }))
        ),
      () => this.toastService.erro("Failed to load client-approved ads")
    );
  }

  get approvedRows(): AdminAdOperationRow[] {
    return this.tableController.items;
  }

  get loading(): boolean {
    return this.tableController.loading;
  }

  get totalRecords(): number {
    return this.tableController.totalRecords;
  }

  get currentPage(): number {
    return this.tableController.currentFilters.page ?? 1;
  }

  get pageSize(): number {
    return this.tableController.currentFilters.size ?? 10;
  }

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

  private buildListFilters(
    base: AdminAdOperationsFilter & LazyTableFilterState
  ): AdminAdOperationsFilter {
    this.ensureCoherentSubmissionDateRange();
    const submissionDateFrom = this.dateToIsoStartUtc(this.colSubmissionFrom);
    const submissionDateTo = this.dateToIsoEndUtc(this.colSubmissionTo);
    return {
      page: base.page ?? 1,
      size: base.size ?? 10,
      genericFilter: base.genericFilter,
      validation: "APPROVED",
      sortBy: base.sortBy ?? "submissionDate",
      sortDir: base.sortDir ?? "desc",
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
    this.tableController.setSearchTerm(this.searchTerm);
    this.tableController.load();
  }

  onSearch(): void {
    this.tableController.setSearchTerm(this.searchTerm);
    this.tableController.onSearch();
  }

  onApplyColumnFilters(): void {
    this.tableController.setSearchTerm(this.searchTerm);
    this.tableController.onSearch();
  }

  onClearColumnFilters(): void {
    this.colAdvertiserName = "";
    this.colPartnerName = "";
    this.colBoxIp = "";
    this.colScreenContains = "";
    this.colSubmissionFrom = null;
    this.colSubmissionTo = null;
    this.tableController.setSearchTerm(this.searchTerm);
    this.tableController.onSearch();
  }

  onPageChange(event: TableLazyPageEvent): void {
    this.tableController.setSearchTerm(this.searchTerm);
    this.tableController.onPageChange(event);
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
    const adId = row.adId?.trim();
    if (!adId) {
      return;
    }
    this.previewLoadingAdId = adId;
    this.adminAdOperationsService.getAdPreviewLink(adId).subscribe({
      next: ({ link, mediaType }) => {
        this.previewLoadingAdId = null;
        const url = link?.trim();
        if (!url) {
          this.toastService.erro("No preview link available for this ad.");
          return;
        }
        this.previewTitle = row.adName?.trim() || "Ad";
        this.previewUrl = url;
        const pdf =
          isPdfFile(url, row.adName) ||
          (mediaType?.toLowerCase().includes("pdf") ?? false);
        this.safePdfUrl = pdf
          ? this.sanitizer.bypassSecurityTrustResourceUrl(url)
          : null;
        this.previewVisible = true;
      },
      error: () => {
        this.previewLoadingAdId = null;
        this.toastService.erro("Failed to load ad preview");
      },
    });
  }

  isPreviewLoading(row: AdminAdOperationRow): boolean {
    return this.previewLoadingAdId === row.adId;
  }

  isPartnerRemovalRequested(row: AdminAdOperationRow): boolean {
    return row.partnerRemovalRequested === true;
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

  isAddingToPlaylist(row: AdminAdOperationRow): boolean {
    return this.addingToPlaylistAdId === row.adId;
  }

  canAddToPlaylist(row: AdminAdOperationRow): boolean {
    const monitorId = row.monitorId?.trim();
    return !!monitorId && !this.isSentToBox(row);
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
    const target = this.screenTargetSummary(row);
    const confirmed = await this.confirmationDialogService.confirm({
      title: "Stage on box",
      message: `Stage "${adName}" on the target box${target !== "—" ? ` (${target})` : ""}?`,
      confirmLabel: "Stage",
    });
    if (!confirmed) {
      return;
    }
    this.dispatchingAdId = adId;
    this.adminAdOperationsService.dispatchAdToBox(adId).subscribe({
      next: () => {
        this.toastService.sucesso("Ad staged on box.");
        this.dispatchingAdId = null;
        this.loadApprovedClientAds();
      },
      error: () => {
        this.dispatchingAdId = null;
        this.toastService.erro("Failed to stage ad on box");
      },
    });
  }

  async addToPlaylist(row: AdminAdOperationRow): Promise<void> {
    const adId = row.adId?.trim();
    if (!adId) {
      return;
    }
    const adName = row.adName?.trim() || "this ad";
    const target = this.screenTargetSummary(row);
    const confirmed = await this.confirmationDialogService.confirm({
      title: "Add to playlist",
      message: `Add "${adName}" to the screen playlist${target !== "—" ? ` at ${target}` : ""}? The client will be notified.`,
      confirmLabel: "Add",
    });
    if (!confirmed) {
      return;
    }
    this.addingToPlaylistAdId = adId;
    this.adminAdOperationsService.addAdToPlaylist(adId).subscribe({
      next: () => {
        this.toastService.sucesso("Ad added to screen playlist.");
        this.addingToPlaylistAdId = null;
        this.loadApprovedClientAds();
      },
      error: () => {
        this.addingToPlaylistAdId = null;
        this.toastService.erro("Failed to add ad to playlist");
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
    const target = this.screenTargetSummary(row);
    const stage = row.operationalStage?.trim();
    let message: string;
    if (onScreen && target !== "—") {
      message = `Delete "<strong>${adName}</strong>"? This ad is running on <strong>${target}</strong>. It will be removed from playback permanently.`;
      if (stage) {
        message += `<br/><span class="text-sm">Operational stage: ${stage}</span>`;
      }
    } else if (row.monitorId?.trim() && target !== "—") {
      message = `Delete "<strong>${adName}</strong>"? It is linked to <strong>${target}</strong>. This action cannot be undone.`;
    } else {
      message = onScreen
        ? `Delete "<strong>${adName}</strong>"? It is on a screen or box and will be removed from playback permanently.`
        : `Delete "<strong>${adName}</strong>"? This action cannot be undone.`;
    }
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
