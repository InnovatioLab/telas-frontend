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
import { AdService } from "@app/core/service/api/ad.service";
import { AutenticacaoService } from "@app/core/service/api/autenticacao.service";
import { ClientService } from "@app/core/service/api/client.service";
import { MonitorService } from "@app/core/service/api/monitor.service";
import { ToastService } from "@app/core/service/state/toast.service";
import { Advertisement, AdvertisementStatus } from "@app/model/advertisement";
import {
  CreateMonitorRequestDto,
  UpdateMonitorRequestDto,
} from "@app/model/dto/request/create-monitor.request.dto";
import { FilterMonitorRequestDto } from "@app/model/dto/request/filter-monitor.request.dto";
import { AuthenticatedClientResponseDto } from "@app/model/dto/response/authenticated-client-response.dto";
import { Monitor } from "@app/model/monitors";
import { IconsModule } from "@app/shared/icons/icons.module";
import { IconTvDisplayComponent } from "@app/shared/icons/tv-display.icon";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { ImageValidationUtil } from "@app/utility/src/utils/image-validation.util";
import { MessageService } from "primeng/api";
import { GalleriaModule } from "primeng/galleria";
import { OrderListModule } from "primeng/orderlist";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { CreateMonitorModalComponent } from "../create-monitor-modal/create-monitor-modal.component";
import { EditMonitorModalComponent } from "../edit-monitor-modal/edit-monitor-modal.component";

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
    GalleriaModule,
    OrderListModule,
    ProgressSpinnerModule,
  ],
  templateUrl: "./management-monitors.component.html",
  styleUrls: ["./management-monitors.component.scss"],
})
export class ManagementMonitorsComponent implements OnInit {
  @ViewChild("createMonitorModal")
  createMonitorModal!: CreateMonitorModalComponent;
  @ViewChild("editMonitorModal") editMonitorModal!: EditMonitorModalComponent;
  @ViewChild("fileInput") fileInput!: ElementRef;

  monitors: Monitor[] = [];
  selectedMonitorForAds: Monitor | null = null;
  selectedMonitorForEdit: Monitor | null = null;
  selectedMonitorForDelete: Monitor | null = null;
  loading = false;
  isSorting = false;
  advertisements: Advertisement[] = [];
  createMonitorModalVisible = false;
  editMonitorModalVisible = false;
  adsModalVisible = false;
  deleteConfirmModalVisible = false;
  searchTerm = "";
  totalRecords = 0;
  newAdLink = "";
  currentPage = 1;
  pageSize = 10;
  orderedAdLinks: Ad[] = [];
  galleryImages: any[] = [];
  isAdsLoading = false;
  showCreateAdModal = false;
  loadingCreateAd = false;
  selectedFile: File | null = null;
  newAd: any = { name: "", type: "", bytes: "" };
  uploadAdPreview: string | null = null;
  selectedMonitorForUpload: Monitor | null = null;
  currentFilters: FilterMonitorRequestDto = {
    page: 1,
    size: 10,
    sortBy: "active",
    sortDir: "desc",
  };
  selectedAdIndex: number = 0;
  authenticatedClient: AuthenticatedClientResponseDto | null = null;

  acceptedFileTypes = ".jpg,.jpeg,.png,.gif,.svg,.bmp,.tiff";

  constructor(
    private readonly monitorService: MonitorService,
    private readonly toastService: ToastService,
    private readonly messageService: MessageService,
    private readonly cdr: ChangeDetectorRef,
    private readonly ngZone: NgZone,
    private readonly autenticacaoService: AutenticacaoService,
    private readonly adService: AdService,
    private readonly clientService: ClientService
  ) {}

  ngOnInit(): void {
    this.loadInitialData();
    this.loadAuthenticatedClient();
  }

  loadAuthenticatedClient(): void {
    this.clientService.getAuthenticatedClient().subscribe({
      next: (client) => {
        this.authenticatedClient = client;
      },
      error: (error) => {
        console.error("Error loading authenticated client:", error);
      },
    });
  }

  loadInitialData(): void {
    this.loading = true;

    const filters: FilterMonitorRequestDto = { ...this.currentFilters };
    if (this.searchTerm.trim()) {
      filters.genericFilter = this.searchTerm.trim();
    }

    this.monitorService.getMonitorsWithPagination(filters).subscribe({
      next: (result) => {
        this.monitors = result.list || [];
        this.totalRecords = this.ensureValidNumber(
          result.totalElements ?? (result as any).totalRecords ?? 0
        );
        this.loading = false;
        console.log(this.monitors);
      },
      error: (error) => {
        this.toastService.erro("Error loading monitors");
        this.loading = false;
      },
    });
  }

  loadMonitors(): void {
    this.loading = true;

    const filters: FilterMonitorRequestDto = { ...this.currentFilters };
    if (this.searchTerm.trim()) {
      filters.genericFilter = this.searchTerm.trim();
    }

    this.monitorService.getMonitorsWithPagination(filters).subscribe({
      next: (result) => {
        this.monitors = result.list || [];
        this.totalRecords = this.ensureValidNumber(
          result.totalElements ?? result.totalRecords ?? 0
        );
        this.loading = false;
        this.isSorting = false;
      },
      error: (error) => {
        this.toastService.erro("Error loading monitors");
        this.loading = false;
        this.isSorting = false;
      },
    });
  }

  ensureValidNumber(value: any): number {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  }

  onSearch(): void {
    this.currentFilters.page = 1;
    this.loadMonitors();
  }

  onPageChange(event: any): void {
    this.currentFilters.page = event.page + 1;
    this.currentFilters.size = event.rows;
    this.loadMonitors();
  }

  onSort(event: any): void {
    if (this.isSorting || this.loading) {
      return;
    }

    const newSortBy = event.field;
    const newSortDir = event.order === 1 ? "asc" : "desc";

    if (
      this.currentFilters.sortBy === newSortBy &&
      this.currentFilters.sortDir === newSortDir
    ) {
      return;
    }

    this.isSorting = true;
    this.currentFilters.sortBy = event.field;
    this.currentFilters.sortDir = event.order === 1 ? "asc" : "desc";
    this.loadMonitors();
  }

  openCreateMonitorModal(): void {
    this.createMonitorModalVisible = true;
  }

  createMonitor(monitorRequest: CreateMonitorRequestDto): void {
    this.monitorService.createMonitor(monitorRequest).subscribe({
      next: (newMonitor) => {
        if (newMonitor) {
          this.messageService.add({
            severity: "success",
            summary: "Success",
            detail: "Screen created successfully!",
          });
        }
      },
      error: (error) => {
        this.closeModal();
        this.messageService.add({
          severity: "warn",
          summary: "Warning",
          detail:
            "An error occurred while creating the screen. Please check the data and try again.",
        });
        this.loadMonitors();
      },
      complete: () => {
        this.closeModal();
        this.loadMonitors();
      },
    });
  }

  closeModal(): void {
    this.createMonitorModalVisible = false;
  }

  onCreateMonitorModalClose(): void {
    this.createMonitorModalVisible = false;
  }

  onMonitorCreated(monitorRequest: CreateMonitorRequestDto): void {
    this.createMonitor(monitorRequest);
  }

  onSelectMonitor(monitor: Monitor): void {
    this.selectedMonitorForEdit = { ...monitor };
    this.editMonitorModalVisible = true;
  }

  updateMonitor(updateData: {
    id: string;
    data: UpdateMonitorRequestDto;
  }): void {
    this.loading = true;

    this.monitorService
      .updateMonitor(updateData.id, updateData.data)
      .subscribe({
        next: (updatedMonitor) => {
          this.messageService.add({
            severity: "success",
            summary: "Success",
            detail: "Monitor updated successfully!",
          });
          this.onEditMonitorModalClose();
        },
        error: (error) => {
          this.messageService.add({
            severity: "error",
            summary: "Error",
            detail:
              "Error updating monitor. Please check the data and try again.",
          });
          this.loading = false;
        },
        complete: () => {
          this.loadMonitors();
          this.loading = false;
        },
      });
  }

  onEditMonitorModalClose(): void {
    this.editMonitorModalVisible = false;
    this.selectedMonitorForEdit = null;

    setTimeout(() => {
      this.loadMonitors();
    }, 50);
  }

  onMonitorUpdated(updateData: {
    id: string;
    data: UpdateMonitorRequestDto;
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

    this.loading = true;

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
          this.loading = false;
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
          this.loading = false;
          this.closeDeleteConfirmModal();
        },
      });
  }

  closeDeleteConfirmModal(): void {
    this.deleteConfirmModalVisible = false;
    this.selectedMonitorForDelete = null;
  }

  openAdsModal(monitor: Monitor): void {
    this.selectedMonitorForAds = monitor;
    this.orderedAdLinks = [];
    this.galleryImages = [];
    this.selectedAdIndex = 0;
    this.adsModalVisible = true;
    this.isAdsLoading = true;
    this.loadValidAds(monitor.id);
  }

  loadValidAds(monitorId: string): void {
    this.monitorService.getValidAds(monitorId).subscribe({
      next: (validAds) => {
        if (this.selectedMonitorForAds) {
          this.selectedMonitorForAds.validAds = validAds;
          this.orderedAdLinks = (validAds || []).map((ad: any) => ({
            id: ad.id || "",
            link: ad.link || "",
            fileName: ad.fileName || "Unknown File",
            isAttachedToMonitor: ad.isAttachedToMonitor || false,
          }));
          this.galleryImages = this.orderedAdLinks.map((ad) => ({
            link: ad.link,
            fileName: ad.fileName,
          }));
        }
        this.selectedAdIndex = 0;
        this.isAdsLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.toastService.erro("Error loading valid ads");
        this.isAdsLoading = false;
      },
    });
  }

  closeAdsModal(): void {
    this.ngZone.run(() => {
      this.adsModalVisible = false;
      this.selectedMonitorForAds = null;
      this.orderedAdLinks = [];
      this.galleryImages = [];
      this.selectedAdIndex = 0;
      this.cdr.detectChanges();
    });
  }

  forceCloseAdsModal(): void {
    this.adsModalVisible = false;
    this.selectedMonitorForAds = null;
    this.orderedAdLinks = [];
    this.galleryImages = [];
    this.selectedAdIndex = 0;
    this.cdr.detectChanges();

    setTimeout(() => {
      this.ngZone.run(() => {
        this.adsModalVisible = false;
        this.cdr.detectChanges();
      });
    }, 50);
  }

  onAdsModalHide(): void {
    this.selectedMonitorForAds = null;
    this.orderedAdLinks = [];
    this.galleryImages = [];
    this.selectedAdIndex = 0;
    this.isAdsLoading = false;
  }

  selectAd(index: number): void {
    this.selectedAdIndex = index;
  }

  addAdLink(): void {}

  addValidAd(ad: Ad): void {
    if (!this.orderedAdLinks.some((a) => a.id === ad.id)) {
      this.orderedAdLinks.push(ad);
      this.toastService.sucesso("Ad added. Save to apply changes.");
    }
  }

  removeAdLink(adToRemove: Ad): void {
    this.orderedAdLinks = this.orderedAdLinks.filter(
      (ad) => ad.id !== adToRemove.id
    );
    this.toastService.sucesso("Ad removed temporarily. Save to apply changes.");
  }

  saveAdOrder(): void {
    if (this.selectedMonitorForAds) {
      const monitorId = this.selectedMonitorForAds.id;
      const ads = this.orderedAdLinks.map((ad, idx) => ({
        id: ad.id,
        orderIndex: idx + 1,
      }));

      const payload = {
        size: this.selectedMonitorForAds.size,
        addressId: this.selectedMonitorForAds.address.id,
        locationDescription: this.selectedMonitorForAds.locationDescription,
        type: this.selectedMonitorForAds.type,
        active: this.selectedMonitorForAds.active,
        ads,
      };

      this.monitorService.updateMonitor(monitorId, payload).subscribe({
        next: (response: any) => {
          if (response) {
            this.toastService.sucesso("Ad order saved!");
          }
        },
        error: (error) => {
          console.error("Erro no saveAdOrder:", error);
          this.toastService.erro("Failed to save ad order.");
        },
        complete: () => {
          this.closeAdsModal();
        },
      });
    }
  }

  onOrderListReorder(event: any): void {
    this.selectedAdIndex = 0;
  }

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

    if (monitor.size) {
      details.push(`Size: ${monitor.size}"`);
    }

    if (monitor.type) {
      details.push(`Type: ${monitor.type}`);
    }

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
    const monitorHasNoAds = !monitor.adLinks || monitor.adLinks.length === 0;
    const clientHasNoAds =
      !this.authenticatedClient?.ads ||
      this.authenticatedClient.ads.length === 0;

    return !(monitorHasNoAds && clientHasNoAds);
  }

  viewMonitorDetails(monitor: Monitor): void {
    this.messageService.add({
      severity: "info",
      summary: "Monitor Details",
      detail: `Monitor: ${monitor.name || "Monitor " + monitor.id.substring(0, 8)} | Address: ${this.getMonitorAddress(monitor)} | Details: ${this.getMonitorDetails(monitor)}`,
    });
  }

  loadAdvertisements(): void {
    this.loading = true;

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
        this.totalRecords = response.totalElements || 0;
        this.loading = false;
      },
      error: (error) => {
        console.error("Error loading ads:", error);
        this.toastService.erro("Failed to load ads");
        this.loading = false;
      },
    });
  }

  openUploadAdsModal(monitor: Monitor): void {
    this.selectedMonitorForUpload = monitor;
    this.selectedFile = null;
    this.newAd = { name: "", type: "", bytes: "" };
    this.uploadAdPreview = null;
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      ImageValidationUtil.validateImageFile(file)
        .then((validationResult) => {
          if (!validationResult.isValid) {
            validationResult.errors.forEach((error) => {
              this.toastService.erro(error);
            });
            return;
          }

          this.selectedFile = file;
          this.newAd.name = file.name;
          this.newAd.type = file.type;
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = (reader.result as string).split(",")[1];
            this.newAd.bytes = base64;
            this.uploadAdPreview = reader.result as string;
          };
          reader.readAsDataURL(file);
          this.showCreateAdModal = true;
        })
        .catch((error) => {
          console.error("Error validating image:", error);
          this.toastService.erro("Error validating image file");
        });
    }
  }

  createAdvertisement(): void {
    if (!this.selectedFile || !this.newAd.bytes) return;
    this.loadingCreateAd = true;
    const client = this.autenticacaoService.user;
    if (!client?.id) {
      this.toastService.erro("Client ID not found");
      this.loadingCreateAd = false;
      return;
    }
    const payload = {
      name: this.selectedFile.name,
      type: this.selectedFile.type,
      bytes: this.newAd.bytes,
    };
    this.adService.createClientAd(client.id, payload).subscribe({
      next: () => {
        this.loadingCreateAd = false;
        this.showCreateAdModal = false;
        this.toastService.sucesso("Ads created successfully");
        this.closeAdsModal();
      },
      error: () => {
        this.loadingCreateAd = false;
        this.toastService.erro("Failed to create ad");
      },
    });
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
