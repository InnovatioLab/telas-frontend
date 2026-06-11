import { CommonModule } from "@angular/common";
import { Component, Input, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { SliceStringPipe } from "@app/core/pipes/slice-string.pipe";
import { AdService } from "@app/core/service/api/ad.service";
import { ClientService } from "@app/core/service/api/client.service";
import { ToastService } from "@app/core/service/state/toast.service";
import { Role } from "@app/model/client";
import { CreateClientAdDto } from "@app/model/dto/request/create-client-ad.dto";
import { FilterBoxRequestDto } from "@app/model/dto/request/filter-box-request.dto";
import {
  AdRequestOrigin,
  AdRequestResponseDto,
  AdRequestWorkflowStatus,
  LinkResponseDto,
  PartnerSubmissionMode,
} from "@app/model/dto/response/ad-request-response.dto";
import { IconsModule } from "@app/shared/icons/icons.module";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { PdfViewerService } from "@app/shared/services/pdf-viewer.service";
import { FileUploadPipelineService } from "@app/shared/services/file-upload-pipeline.service";
import { isPdfFile } from "@app/shared/utils/file-type.utils";
import { triggerBrowserFileDownload } from "@app/shared/utils/file-download.util";
import { buildQuestionnaireExportFileName } from "@app/shared/utils/questionnaire-export-filename.util";
import { LazyTableController, LazyTableFilterState } from "@app/shared/utils/lazy-table.controller";
import { TableLazyPageEvent } from "@app/shared/utils/table-lazy-pagination.utils";
import { map, tap } from "rxjs/operators";
import { PdfViewerModule } from "ng2-pdf-viewer";
import { Router } from "@angular/router";
import { NotificationsService } from "@app/core/service/api/notifications.service";
import { ConfirmationDialogService } from "@app/shared/services/confirmation-dialog.service";

@Component({
  selector: "app-ad-request-management",
  standalone: true,
  imports: [
    CommonModule,
    PrimengModule,
    FormsModule,
    SliceStringPipe,
    IconsModule,
    PdfViewerModule,
  ],
  templateUrl: "./ad-request-management.component.html",
  styleUrls: ["./ad-request-management.component.scss"],
})
export class AdRequestManagementComponent implements OnInit {
  @Input() requestOrigin: AdRequestOrigin = "CLIENT";

  searchTerm = "";

  readonly tableController: LazyTableController<
    AdRequestResponseDto,
    FilterBoxRequestDto & LazyTableFilterState
  >;

  showViewDetailsDialog = false;
  showUploadAdDialog = false;
  loadingRequestMedia = false;
  selectedAdRequest: AdRequestResponseDto | null = null;

  selectedFile: File | null = null;
  filePreview: string | null = null;
  loadingUpload = false;

  maxFileSize = 10 * 1024 * 1024;
  acceptedFileTypes = ".jpg,.jpeg,.png,.gif,.svg,.bmp,.tiff,.pdf";

  constructor(
    private readonly clientService: ClientService,
    private readonly adService: AdService,
    private readonly toastService: ToastService,
    private readonly pdfViewerService: PdfViewerService,
    private readonly fileUploadPipeline: FileUploadPipelineService,
    private readonly router: Router,
    private readonly notificationsService: NotificationsService,
    private readonly confirmationDialogService: ConfirmationDialogService
  ) {
    this.tableController = new LazyTableController<
      AdRequestResponseDto,
      FilterBoxRequestDto & LazyTableFilterState
    >(
      {
        page: 1,
        size: 10,
        sortBy: "createdAt",
        sortDir: "desc",
        includeInactiveRequests: false,
      },
      (filters) =>
        this.clientService
          .getAllAdRequests({
            ...(filters as FilterBoxRequestDto),
            requestOrigin: this.requestOrigin,
          })
          .pipe(
            map((response) => ({
              list: response.list || [],
              totalElements: response.totalElements || 0,
            })),
          ),
      () => this.toastService.error("Failed to load ad requests")
    );
  }

  get adRequests(): AdRequestResponseDto[] {
    return this.tableController.items;
  }

  get loading(): boolean {
    return this.tableController.loading;
  }

  get totalRecords(): number {
    return this.tableController.totalRecords;
  }

  get currentFilters(): FilterBoxRequestDto & LazyTableFilterState {
    return this.tableController.currentFilters;
  }

  get pageSize(): number {
    return this.tableController.currentFilters.size ?? 10;
  }

  private unreadMessagesByClientId = new Map<string, number>();

  ngOnInit(): void {
    this.loadAdRequests();
    this.refreshUnreadMessageCounters();
  }

  loadAdRequests(): void {
        this.tableController.load(this.searchTerm);
  }

  openMessagesHistory(adRequest: AdRequestResponseDto): void {
    const clientId = String(adRequest?.clientId ?? "").trim();
    if (!clientId) return;
    this.router.navigate([`/admin/clients/${clientId}/messages`]);
  }

  getUnreadMessagesCount(adRequest: AdRequestResponseDto): number {
    const clientId = String(adRequest?.clientId ?? "").trim();
    if (!clientId) return 0;
    return this.unreadMessagesByClientId.get(clientId) ?? 0;
  }

  private refreshUnreadMessageCounters(): void {
    this.notificationsService.fetchAllNotifications().subscribe(() => {
      const all = this.notificationsService.allNotifications();
      const map = new Map<string, number>();
      for (const n of all) {
        if (!n || n.visualized) continue;
        if (String(n.reference) !== "CLIENT_AD_REJECTED") continue;
        const m = String(n.actionUrl || "");
        const match = m.match(/\/admin\/clients\/([0-9a-fA-F-]{36})\/messages/);
        const clientId = match?.[1];
        if (!clientId) continue;
        map.set(clientId, (map.get(clientId) ?? 0) + 1);
      }
      this.unreadMessagesByClientId = map;
    });
  }

  onSearch(): void {
        this.tableController.onSearch(this.searchTerm);
  }

  onPageChange(event: TableLazyPageEvent): void {
        this.tableController.onPageChange(event, this.searchTerm);
  }

  onSort(event: { field?: string; order?: number }): void {
        this.tableController.onSort(event, this.searchTerm);
  }

  openViewDetailsDialog(adRequest: AdRequestResponseDto): void {
    this.selectedAdRequest = { ...adRequest, attachments: [], ad: null };
    this.showViewDetailsDialog = true;
    this.loadingRequestMedia = true;
    this.clientService.getAdRequestMedia(adRequest.id).subscribe({
      next: (media) => {
        if (this.selectedAdRequest?.id === adRequest.id) {
          this.selectedAdRequest = {
            ...this.selectedAdRequest,
            ad: media.ad,
            attachments: media.attachments ?? [],
          };
        }
        this.loadingRequestMedia = false;
      },
      error: () => {
        this.loadingRequestMedia = false;
        this.toastService.error("Failed to load ad request media");
        this.closeViewDetailsDialog();
      },
    });
  }

  shouldShowSeparateLastAdSection(ar: AdRequestResponseDto): boolean {
    const ad = ar.ad;
    if (!ad?.attachmentLink && !ad?.attachmentId) {
      return false;
    }
    const attachments = ar.attachments ?? [];
    if (attachments.length === 0) {
      return true;
    }
    return !attachments.some((att) => this.sameLinkAsset(att, ad));
  }

  private sameLinkAsset(a: LinkResponseDto, b: LinkResponseDto): boolean {
    if (a.attachmentId && b.attachmentId && a.attachmentId === b.attachmentId) {
      return true;
    }
    const strip = (u: string | undefined) => (u ?? "").trim().split("?")[0];
    const linkA = strip(a.attachmentLink);
    const linkB = strip(b.attachmentLink);
    if (linkA !== "" && linkA === linkB) {
      return true;
    }
    const dlA = strip(a.attachmentDownloadLink);
    const dlB = strip(b.attachmentDownloadLink);
    if (dlA !== "" && dlA === dlB) {
      return true;
    }
    if (linkA !== "" && linkA === strip(b.attachmentDownloadLink)) {
      return true;
    }
    if (linkB !== "" && linkB === strip(a.attachmentDownloadLink)) {
      return true;
    }
    return false;
  }

  closeViewDetailsDialog(): void {
    this.showViewDetailsDialog = false;
    this.selectedAdRequest = null;
  }

  openUploadAdDialog(adRequest: AdRequestResponseDto): void {
    this.selectedAdRequest = adRequest;
    this.selectedFile = null;
    this.filePreview = null;
    this.showUploadAdDialog = true;
  }

  closeUploadAdDialog(): void {
    this.showUploadAdDialog = false;
    this.selectedAdRequest = null;
    this.selectedFile = null;
    this.filePreview = null;
  }

  onFileInputChange(event: any, adRequest: AdRequestResponseDto): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedAdRequest = adRequest;

      this.fileUploadPipeline
        .validateFile(file)
        .then(async (validationResult) => {
          if (!validationResult.isValid) {
            validationResult.errors.forEach((error) => {
              this.toastService.error(error);
            });
            return;
          }

          this.selectedFile = file;
          this.filePreview = await this.fileUploadPipeline.readAsDataUrl(file);
          this.showUploadAdDialog = true;
        })
        .catch(() => {
          this.toastService.error("Error validating image file");
        });
    }
  }

  onFileSelect(event: any): void {
    const file = event.files[0];
    if (file) {
      this.fileUploadPipeline
        .validateFile(file)
        .then(async (validationResult) => {
          if (!validationResult.isValid) {
            validationResult.errors.forEach((error) => {
              this.toastService.error(error);
            });
            return;
          }

          this.selectedFile = file;
          this.filePreview = await this.fileUploadPipeline.readAsDataUrl(file);
          this.showUploadAdDialog = true;
        })
        .catch(() => {
          this.toastService.error("Error validating image file");
        });
    }
  }

  private onUploadSuccess(): void {
    this.toastService.success("Ad uploaded successfully");
    this.closeUploadAdDialog();
    this.loadAdRequests();
    this.loadingUpload = false;
  }

  private uploadPartnerAd(payload: CreateClientAdDto): void {
    const adRequestId = this.selectedAdRequest?.id;
    if (!adRequestId) {
      this.loadingUpload = false;
      return;
    }
    this.clientService.uploadAdForAdRequest(adRequestId, payload).subscribe({
      next: () => this.onUploadSuccess(),
      error: () => {
        this.toastService.error("Failed to upload ad");
        this.loadingUpload = false;
      },
    });
  }

  approveToAds(adRequest: AdRequestResponseDto): void {
    void this.approveToAdsAsync(adRequest);
  }

  private async approveToAdsAsync(adRequest: AdRequestResponseDto): Promise<void> {
    const confirmed = await this.confirmationDialogService.confirm({
      title: "Send to Ads",
      message:
        "Approve this finished creative and move it to the approved ads list?",
      confirmLabel: "Approve",
    });
    if (!confirmed) return;
    this.clientService.approveAdRequestToAds(adRequest.id).subscribe({
      next: () => {
        this.toastService.success("Ad approved and moved to Ads");
        this.loadAdRequests();
      },
      error: () => this.toastService.error("Failed to approve ad"),
    });
  }

  cancelRequest(adRequest: AdRequestResponseDto): void {
    void this.cancelRequestAsync(adRequest);
  }

  private async cancelRequestAsync(adRequest: AdRequestResponseDto): Promise<void> {
    const confirmed = await this.confirmationDialogService.confirm({
      title: "Cancel request",
      message: "Remove this ad request from the queue?",
      confirmLabel: "Remove",
      severity: "warn",
    });
    if (!confirmed) return;
    this.clientService.cancelAdRequest(adRequest.id).subscribe({
      next: () => {
        this.toastService.success("Ad request cancelled");
        this.loadAdRequests();
      },
      error: () => this.toastService.error("Failed to cancel ad request"),
    });
  }

  canUpload(adRequest: AdRequestResponseDto): boolean {
    const status = adRequest.workflowStatus;
    return (
      status === "AWAITING_ADMIN_UPLOAD" ||
      status === "REOPENED_AFTER_REJECTION"
    );
  }

  canApproveToAds(adRequest: AdRequestResponseDto): boolean {
    return adRequest.workflowStatus === "AWAITING_ADMIN_DIRECT_APPROVAL";
  }

  canCancel(adRequest: AdRequestResponseDto): boolean {
    return adRequest.adValidation !== "APPROVED";
  }

  canViewAd(adRequest: AdRequestResponseDto): boolean {
    const attachmentCount = adRequest.attachmentCount ?? adRequest.attachments?.length ?? 0;
    return attachmentCount > 0 || adRequest.hasAdMedia === true;
  }

  isPartnerRemovalRequested(adRequest: AdRequestResponseDto): boolean {
    return adRequest.partnerRemovalRequested === true;
  }

  get isPartnerSection(): boolean {
    return this.requestOrigin === "PARTNER";
  }

  getWorkflowLabel(status?: AdRequestWorkflowStatus): string {
    switch (status) {
      case "AWAITING_ADMIN_UPLOAD":
        return "Awaiting admin upload";
      case "AWAITING_PARTNER_REVIEW":
        return "Awaiting partner review";
      case "AWAITING_CLIENT_REVIEW":
        return "Awaiting client review";
      case "AWAITING_ADMIN_DIRECT_APPROVAL":
        return "Awaiting admin approval";
      case "REOPENED_AFTER_REJECTION":
        return "Reopened after rejection";
      default:
        return status ?? "—";
    }
  }

  getModeLabel(mode?: PartnerSubmissionMode | null): string {
    switch (mode) {
      case "ADMIN_MATERIALS":
        return "Create Ad";
      case "PARTNER_FINISHED_CREATIVE":
        return "Finished Ad";
      case "READY_CREATIVE":
        return "Ready creative";
      default:
        return "—";
    }
  }

  getWorkflowSeverity(
    status?: AdRequestWorkflowStatus
  ): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" {
    switch (status) {
      case "REOPENED_AFTER_REJECTION":
        return "danger";
      case "AWAITING_PARTNER_REVIEW":
      case "AWAITING_CLIENT_REVIEW":
        return "warn";
      case "AWAITING_ADMIN_DIRECT_APPROVAL":
        return "info";
      default:
        return "secondary";
    }
  }

  openViewAd(adRequest: AdRequestResponseDto): void {
    this.openViewDetailsDialog(adRequest);
  }

  uploadAd(): void {
    if (!this.selectedFile || !this.selectedAdRequest) {
      this.toastService.error("No file selected");
      return;
    }

    this.loadingUpload = true;

    void this.fileUploadPipeline
      .readAsBase64(this.selectedFile)
      .then((base64Data) => {
        const payload: CreateClientAdDto = {
          name: this.selectedFile!.name,
          type: this.fileUploadPipeline.getFileType(this.selectedFile!),
          bytes: base64Data,
        };

        if (this.requestOrigin === "PARTNER") {
          this.uploadPartnerAd(payload);
          return;
        }

        this.adService
          .createClientAd(this.selectedAdRequest!.clientId, payload)
          .subscribe({
            next: () => this.onUploadSuccess(),
            error: () => {
              this.toastService.error("Failed to upload ad");
              this.loadingUpload = false;
            },
          });
      })
      .catch(() => {
        this.toastService.error("Failed to read file");
        this.loadingUpload = false;
      });
  }

  isDataPdf(preview: string | null): boolean {
    if (!preview) return false;
    try {
      return preview.startsWith("data:application/pdf");
    } catch (err) {
      return false;
    }
  }

  viewAttachment(link: string): void {
    if (isPdfFile(link)) {
      this.pdfViewerService.openPdf(link, 'Attachment');
    } else {
      window.open(link, "_blank");
    }
  }

  isPdfAttachment(link: string): boolean {
    return isPdfFile(link);
  }

  downloadAttachment(url: string, fileName?: string): void {
    triggerBrowserFileDownload(url, fileName);
  }

  getAbsoluteUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    const trimmed = url.trim();
    if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed)) return trimmed;
    return `https://${trimmed.replace(/^\/+/, "")}`;
  }

  getPartnerStatusSeverity(
    role: string
  ): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" {
    return role === Role.PARTNER ? "success" : "info";
  }

  getPartnerStatusLabel(role: string): string {
    return role === Role.PARTNER ? "Partner" : "Client";
  }

  getRoleLabel(role: string): string {
    switch (role?.toLowerCase()) {
      case "admin":
        return "Administrator";
      case "client":
        return "Client";
      case "partner":
        return "Partner";
      default:
        return role || "Unknown";
    }
  }

  downloadQuestionnaireTxt(adRequest: AdRequestResponseDto): void {
    const id = adRequest?.id;
    if (!id) {
      return;
    }
    this.clientService.downloadAdRequestBusinessQuestionnaireTxt(id).subscribe({
      next: ({ blob, fileName }) => {
        const url = URL.createObjectURL(blob);
        const resolvedName =
          fileName?.trim() ||
          buildQuestionnaireExportFileName(
            adRequest.clientName,
            adRequest.ad?.attachmentName
          );
        triggerBrowserFileDownload(url, resolvedName);
        URL.revokeObjectURL(url);
      },
      error: () => {
        this.toastService.error("Could not download questionnaire");
      },
    });
  }
}
