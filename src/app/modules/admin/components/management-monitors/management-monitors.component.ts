import { CommonModule } from "@angular/common";
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  NgZone,
  OnInit,
  ViewChild,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { AdService } from "@app/core/service/api/ad.service";
import { AutenticacaoService } from "@app/core/service/api/autenticacao.service";
import { ClientService } from "@app/core/service/api/client.service";
import { MonitorService } from "@app/core/service/api/monitor.service";
import { SmartPlugAdminService } from "@app/core/service/api/smart-plug-admin.service";
import { ToastService } from "@app/core/service/state/toast.service";
import { Advertisement, AdvertisementStatus } from "@app/model/advertisement";
import {
  CreateMonitorRequestDto,
  UpdateMonitorRequestDto,
} from "@app/model/dto/request/create-monitor.request.dto";
import { FilterMonitorRequestDto } from "@app/model/dto/request/filter-monitor.request.dto";
import { AuthenticatedClientResponseDto } from "@app/model/dto/response/authenticated-client-response.dto";
import { AvailablePartnerAddressResponseDto } from "@app/model/dto/response/available-partner-address.response.dto";
import { Role, isPrivilegedPanelRole } from "@app/model/client";
import { MonitoringPermission } from "@app/model/monitoring-permission";
import { Monitor } from "@app/model/monitors";
import { IconsModule } from "@app/shared/icons/icons.module";
import { IconTvDisplayComponent } from "@app/shared/icons/tv-display.icon";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { FileUploadPipelineService } from "@app/shared/services/file-upload-pipeline.service";
import { isPdfFile } from "@app/shared/utils/file-type.utils";
import { LazyTableController, LazyTableFilterState } from "@app/shared/utils/lazy-table.controller";
import { TableLazyPageEvent } from "@app/shared/utils/table-lazy-pagination.utils";
import { map } from "rxjs/operators";
import { PdfViewerModule } from "ng2-pdf-viewer";
import { MessageService } from "primeng/api";
import { GalleriaModule } from "primeng/galleria";
import { OrderListModule } from "primeng/orderlist";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { Observable, of } from "rxjs";
import { switchMap, take } from "rxjs/operators";
import { CreateMonitorModalComponent } from "../create-monitor-modal/create-monitor-modal.component";
import { EditMonitorModalComponent } from "../edit-monitor-modal/edit-monitor-modal.component";
import { AttachmentRequestDto } from "@app/model/dto/request/attachment-request.dto";

interface Ad {
  id: string;
  link: string;
  fileName: string;
  isAttachedToMonitor: boolean;
}

@Component({
  selector: "app-management-monitors",
  standalone: true,
  imports: [
    CommonModule,
    PrimengModule,
    FormsModule,
    IconsModule,
    CreateMonitorModalComponent,
    EditMonitorModalComponent,
    IconTvDisplayComponent,
    RouterModule,
    GalleriaModule,
    OrderListModule,
    ProgressSpinnerModule,
    PdfViewerModule,
  ],
  templateUrl: "./management-monitors.component.html",
  styleUrls: ["./management-monitors.component.scss"],
})
export class ManagementMonitorsComponent implements OnInit {
  @ViewChild("createMonitorModal")
  createMonitorModal!: CreateMonitorModalComponent;
  @ViewChild("editMonitorModal") editMonitorModal!: EditMonitorModalComponent;
  @ViewChild("fileInput") fileInput!: ElementRef;

  selectedMonitorForEdit: Monitor | null = null;
  selectedMonitorForDelete: Monitor | null = null;
  private operationLoading = false;
  advertisements: Advertisement[] = [];
  createMonitorModalVisible = false;
  editMonitorModalVisible = false;
  deleteConfirmModalVisible = false;
  searchTerm = "";
  newAdLink = "";
  showCreateAdModal = false;
  loadingCreateAd = false;
  selectedFile: File | null = null;
  newAd: any = { name: "", type: "", bytes: "" };
  uploadAdPreview: string | null = null;
  selectedMonitorForUpload: Monitor | null = null;

  readonly tableController: LazyTableController<
    Monitor,
    FilterMonitorRequestDto & LazyTableFilterState
  >;

  authenticatedClient: AuthenticatedClientResponseDto | null = null;

  acceptedFileTypes = ".jpg,.jpeg,.png,.gif,.svg,.bmp,.tiff,.pdf";

  availablePartnerAddresses: AvailablePartnerAddressResponseDto[] = [];
  loadingPartnerAddresses = false;

  constructor(
    private readonly monitorService: MonitorService,
    private readonly toastService: ToastService,
    private readonly messageService: MessageService,
    private readonly cdr: ChangeDetectorRef,
    private readonly ngZone: NgZone,
    private readonly autenticacaoService: AutenticacaoService,
    private readonly adService: AdService,
    private readonly clientService: ClientService,
    private readonly smartPlugAdmin: SmartPlugAdminService,
    private readonly fileUploadPipeline: FileUploadPipelineService
  ) {
    this.tableController = new LazyTableController<
      Monitor,
      FilterMonitorRequestDto & LazyTableFilterState
    >(
      { page: 1, size: 10, sortBy: "active", sortDir: "desc" },
      (filters) =>
        this.monitorService
          .getMonitorsWithPagination(filters as FilterMonitorRequestDto)
          .pipe(
          map((result) => ({
            list: result.list || [],
            totalElements: this.ensureValidNumber(
              result.totalElements ?? result.totalRecords ?? 0
            ),
          }))
        ),
      () => this.toastService.erro("Error loading monitors")
    );
  }

  get monitors(): Monitor[] {
    return this.tableController.items;
  }

  get loading(): boolean {
    return this.tableController.loading || this.operationLoading;
  }

  get totalRecords(): number {
    return this.tableController.totalRecords;
  }

  get currentFilters(): FilterMonitorRequestDto & LazyTableFilterState {
    return this.tableController.currentFilters;
  }

  get currentPage(): number {
    return this.tableController.currentFilters.page ?? 1;
  }

  get pageSize(): number {
    return this.tableController.currentFilters.size ?? 10;
  }

  ngOnInit(): void {
    this.loadInitialData();
    this.loadAuthenticatedClient();
    this.refreshAvailablePartnerAddresses();
  }

  get isDeveloper(): boolean {
    return this.authenticatedClient?.role === Role.DEVELOPER;
  }

  loadAuthenticatedClient(): void {
    this.clientService.clientAtual$
      .pipe(
        take(1),
        switchMap((client) =>
          client ? of(client) : this.clientService.getAuthenticatedClient()
        )
      )
      .subscribe({
        next: (client) => {
          this.authenticatedClient = client as any;
        },
        error: (error) => {
          
        },
      });
  }

  loadInitialData(): void {
    this.tableController.setSearchTerm(this.searchTerm);
    this.tableController.load();
  }

  loadMonitors(): void {
    this.tableController.setSearchTerm(this.searchTerm);
    this.tableController.load();
    this.refreshAvailablePartnerAddresses();
  }

  refreshAvailablePartnerAddresses(): void {
    this.loadingPartnerAddresses = true;
    this.monitorService.getAvailablePartnerAddresses().subscribe({
      next: (rows) => {
        this.availablePartnerAddresses = rows;
        this.loadingPartnerAddresses = false;
      },
      error: () => {
        this.availablePartnerAddresses = [];
        this.loadingPartnerAddresses = false;
      },
    });
  }

  ensureValidNumber(value: unknown): number {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  }

  onSearch(): void {
    this.tableController.setSearchTerm(this.searchTerm);
    this.tableController.onSearch();
  }

  onPageChange(event: TableLazyPageEvent): void {
    this.tableController.setSearchTerm(this.searchTerm);
    this.tableController.onPageChange(event);
  }

  onSort(event: { field?: string; order?: number }): void {
    this.tableController.setSearchTerm(this.searchTerm);
    this.tableController.onSort(event);
  }

  openCreateMonitorModal(): void {
    this.refreshAvailablePartnerAddresses();
    this.createMonitorModalVisible = true;
  }

  createMonitor(
    monitorRequest: CreateMonitorRequestDto,
    smartPlugId?: string | null
  ): void {
    this.monitorService.createMonitor(monitorRequest).subscribe({
      next: (newMonitor) => {
        if (newMonitor?.id && smartPlugId) {
          this.smartPlugAdmin.assign(smartPlugId, newMonitor.id).subscribe({
            next: () => {
              this.messageService.add({
                severity: "success",
                summary: "Success",
                detail: "Screen created and smart plug linked.",
              });
              this.closeModal();
              this.loadMonitors();
            },
            error: () => {
              this.messageService.add({
                severity: "warn",
                summary: "Partial success",
                detail:
                  "Screen was created but smart plug assignment failed. Link it from edit.",
              });
              this.closeModal();
              this.loadMonitors();
            },
          });
          return;
        }
        if (newMonitor) {
          this.messageService.add({
            severity: "success",
            summary: "Success",
            detail: "Screen created successfully!",
          });
          this.closeModal();
          this.loadMonitors();
        }
      },
      error: () => {
        this.messageService.add({
          severity: "error",
          summary: "Error",
          detail:
            "An error occurred while creating the screen. Please check the data and try again.",
        });
      },
    });
  }

  closeModal(): void {
    this.createMonitorModalVisible = false;
  }

  onCreateMonitorModalClose(): void {
    this.createMonitorModalVisible = false;
  }

  onMonitorCreated(payload: {
    request: CreateMonitorRequestDto;
    smartPlugId: string | null;
  }): void {
    this.createMonitor(payload.request, payload.smartPlugId);
  }

  onSelectMonitor(monitor: Monitor): void {
    if (!monitor?.id) {
      return;
    }
    this.operationLoading = true;
    this.monitorService.getMonitorById(monitor.id).subscribe({
      next: (full) => {
        this.selectedMonitorForEdit = full ?? { ...monitor };
        this.refreshAvailablePartnerAddresses();
        this.editMonitorModalVisible = true;
        this.operationLoading = false;
      },
      error: () => {
        this.selectedMonitorForEdit = { ...monitor };
        this.refreshAvailablePartnerAddresses();
        this.editMonitorModalVisible = true;
        this.operationLoading = false;
      },
    });
  }

  updateMonitor(updateData: {
    id: string;
    data: UpdateMonitorRequestDto;
    smartPlugId: string | null;
    initialSmartPlugId: string | null;
  }): void {
    this.operationLoading = true;

    this.monitorService
      .updateMonitor(updateData.id, updateData.data)
      .pipe(
        switchMap(() =>
          this.applySmartPlugSelection(
            updateData.id,
            updateData.smartPlugId,
            updateData.initialSmartPlugId
          )
        )
      )
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: "success",
            summary: "Success",
            detail: "Monitor updated successfully!",
          });
          this.onEditMonitorModalClose();
          this.loadMonitors();
          this.operationLoading = false;
        },
        error: () => {
          this.messageService.add({
            severity: "error",
            summary: "Error",
            detail:
              "Error updating monitor. Please check the data and try again.",
          });
          this.operationLoading = false;
        },
      });
  }

  private applySmartPlugSelection(
    monitorId: string,
    smartPlugId: string | null,
    initialSmartPlugId: string | null
  ): Observable<unknown> {
    const next = smartPlugId ?? null;
    const prev = initialSmartPlugId ?? null;
    if (next === prev) {
      return of(null);
    }
    let seq: Observable<unknown> = of(null);
    if (prev && prev !== next) {
      seq = seq.pipe(
        switchMap(() => this.smartPlugAdmin.unassign(prev))
      );
    }
    if (next && next !== prev) {
      seq = seq.pipe(
        switchMap(() => this.smartPlugAdmin.assign(next, monitorId))
      );
    }
    return seq;
  }

  onEditMonitorModalClose(): void {
    this.editMonitorModalVisible = false;
    this.selectedMonitorForEdit = null;
  }

  onMonitorUpdated(updateData: {
    id: string;
    data: UpdateMonitorRequestDto;
    smartPlugId: string | null;
    initialSmartPlugId: string | null;
  }): void {
    this.updateMonitor(updateData);
  }

  deleteMonitor(monitor: Monitor): void {
    this.selectedMonitorForDelete = { ...monitor };
    this.deleteConfirmModalVisible = true;
  }

  confirmDelete(): void {
    if (!this.selectedMonitorForDelete) {
      return;
    }

    this.operationLoading = true;

    this.monitorService
      .deleteMonitor(this.selectedMonitorForDelete.id)
      .subscribe({
        next: (success) => {
          if (success) {
            this.messageService.add({
              severity: "success",
              summary: "Success",
              detail: "Monitor deleted successfully!",
            });
            this.loadMonitors();
          } else {
            this.messageService.add({
              severity: "error",
              summary: "Error",
              detail: "Error deleting monitor.",
            });
          }
          this.operationLoading = false;
          this.closeDeleteConfirmModal();
        },
        error: (error) => {
          this.messageService.add({
            severity: "error",
            summary: "Error",
            detail: "Error deleting monitor.",
          });
        },
        complete: () => {
          this.operationLoading = false;
          this.closeDeleteConfirmModal();
        },
      });
  }

  closeDeleteConfirmModal(): void {
    this.deleteConfirmModalVisible = false;
    this.selectedMonitorForDelete = null;
  }

  addAdLink(): void {}

  getMonitorAddress(monitor: Monitor): string {
    if (!monitor.address) {
      return "N/A";
    }

    if (monitor.address.coordinatesParams) {
      return monitor.address.coordinatesParams;
    }

    const addressParts = [];

    if (monitor.address.street) {
      addressParts.push(monitor.address.street);
    }

    if (monitor.address.city) {
      addressParts.push(monitor.address.city);
    }

    if (monitor.address.state) {
      addressParts.push(monitor.address.state);
    }

    if (monitor.address.zipCode) {
      addressParts.push(monitor.address.zipCode);
    }

    return addressParts.length > 0 ? addressParts.join(", ") : "N/A";
  }

  getMonitorDetails(monitor: Monitor): string {
    const details = [];

    if (monitor.adLinks && monitor.adLinks.length > 0) {
      details.push(`Ads: ${monitor.adLinks.length}`);
    }

    return details.join(" • ");
  }

  getDeleteButtonClass(monitor: Monitor): string {
    const baseClass = "p-button-rounded p-button-danger p-button-text";
    if (!monitor.canBeDeleted) {
      return baseClass + " p-button-disabled";
    }
    return baseClass;
  }

  shouldShowManageAdsButton(monitor: Monitor): boolean {
    const client = this.authenticatedClient;
    if (isPrivilegedPanelRole(client?.role)) {
      return true;
    }
    if (
      client?.role === Role.PARTNER &&
      (client.permissions ?? []).includes(MonitoringPermission.ADMIN_ADS_MANAGE)
    ) {
      return true;
    }
    const monitorHasNoAds = !monitor.adLinks || monitor.adLinks.length === 0;
    const clientHasNoAds = !client?.ads || client.ads.length === 0;

    return !(monitorHasNoAds && clientHasNoAds);
  }

  viewMonitorDetails(monitor: Monitor): void {
    this.messageService.add({
      severity: "info",
      summary: "Monitor Details",
      detail: `Monitor: ${"Monitor " + monitor.id.substring(0, 8)} | Address: ${this.getMonitorAddress(monitor)} | Details: ${this.getMonitorDetails(monitor)}`,
    });
  }

  loadAdvertisements(): void {
    this.operationLoading = true;

    this.clientService.getAllAds(this.currentPage, this.pageSize).subscribe({
      next: (response) => {
        this.advertisements = (response.content || []).map((adDto) => ({
          id: adDto.id,
          title: `Advertisement ${adDto.id}`,
          description: `Ad submitted on ${adDto.submissionDate}`,
          status: this.convertValidationTypeToStatus(adDto.validation),
          clientId: "",
          clientName: "",
          createdAt: adDto.submissionDate,
          updatedAt: adDto.submissionDate,
          link: adDto.link,
          imageUrl: "",
          startDate: "",
          endDate: "",
          priority: 0,
        }));
        this.operationLoading = false;
      },
      error: (error) => {
        
        this.toastService.erro("Failed to load ads");
        this.operationLoading = false;
      },
    });
  }

  openUploadAdsModal(monitor: Monitor): void {
    if (!this.authenticatedClient) {
      this.loadAuthenticatedClient();
    }
    
    this.selectedMonitorForUpload = monitor;
    this.selectedFile = null;
    this.newAd = { name: "", type: "", bytes: "" };
    this.uploadAdPreview = null;
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.fileUploadPipeline
        .validateFile(file)
        .then(async (validationResult) => {
          if (!validationResult.isValid) {
            validationResult.errors.forEach((error) => {
              this.toastService.erro(error);
            });
            return;
          }

          this.selectedFile = file;
          this.newAd.name = file.name;
          this.newAd.type = this.fileUploadPipeline.getFileType(file);
          const dataUrl = await this.fileUploadPipeline.readAsDataUrl(file);
          this.newAd.bytes = dataUrl.split(",")[1] ?? "";
          this.uploadAdPreview = dataUrl;
          this.showCreateAdModal = true;
          this.cdr.markForCheck();
        })
        .catch(() => {
          this.toastService.erro("Error validating image file");
        });
    }
  }

  isPdfFile(fileName: string): boolean {
    return isPdfFile(fileName);
  }

  createAdvertisement(): void {
    if (!this.selectedFile || !this.newAd.bytes) {
      this.toastService.erro("Please select a file");
      return;
    }
    
    this.loadingCreateAd = true;
    
    if (!this.selectedMonitorForUpload?.id) {
      this.toastService.erro("Screen not selected.");
      this.loadingCreateAd = false;
      return;
    }

    const payload: AttachmentRequestDto = {
      name: this.selectedFile.name,
      type: this.selectedFile.type,
      bytes: this.newAd.bytes,
    };

    this.monitorService
      .uploadDirectAdToMonitor(this.selectedMonitorForUpload.id, payload)
      .subscribe({
        next: () => {
          this.loadingCreateAd = false;
          this.closeUploadAdModal();
          this.toastService.sucesso("Ad sent to screen.");
          this.messageService.add({
            severity: "success",
            summary: "Success",
            detail: "Ad sent to screen.",
          });
          this.loadMonitors();
        },
        error: (error) => {
          this.loadingCreateAd = false;
          const raw =
            error?.error?.message ??
            error?.error?.data ??
            error?.message;
          const msg =
            typeof raw === "string"
              ? raw
              : raw != null
                ? JSON.stringify(raw)
                : "Failed to send ad to screen.";
          this.toastService.erro(msg);
          this.messageService.add({
            severity: "error",
            summary: "Upload failed",
            detail: msg,
          });
        },
      });
  }

  closeUploadAdModal(): void {
    this.showCreateAdModal = false;
    this.selectedMonitorForUpload = null;
    this.selectedFile = null;
    this.newAd = { name: "", type: "", bytes: "" };
    this.uploadAdPreview = null;
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = "";
    }
  }

  private convertValidationTypeToStatus(
    validationType: string
  ): AdvertisementStatus {
    switch (validationType?.toUpperCase()) {
      case "APPROVED":
        return AdvertisementStatus.APPROVED;
      case "REJECTED":
        return AdvertisementStatus.REJECTED;
      case "PENDING":
        return AdvertisementStatus.PENDING;
      default:
        return AdvertisementStatus.PENDING;
    }
  }
}
