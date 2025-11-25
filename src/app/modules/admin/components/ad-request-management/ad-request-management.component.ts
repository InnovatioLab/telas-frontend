import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { SliceStringPipe } from "@app/core/pipes/slice-string.pipe";
import { AdService } from "@app/core/service/api/ad.service";
import { ClientService } from "@app/core/service/api/client.service";
import { ToastService } from "@app/core/service/state/toast.service";
import { Role } from "@app/model/client";
import { CreateClientAdDto } from "@app/model/dto/request/create-client-ad.dto";
import { FilterBoxRequestDto } from "@app/model/dto/request/filter-box-request.dto";
import { AdRequestResponseDto } from "@app/model/dto/response/ad-request-response.dto";
import { IconsModule } from "@app/shared/icons/icons.module";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { ImageValidationUtil } from "@app/utility/src/utils/image-validation.util";

@Component({
  selector: "app-ad-request-management",
  standalone: true,
  imports: [
    CommonModule,
    PrimengModule,
    FormsModule,
    SliceStringPipe,
    IconsModule,
  ],
  templateUrl: "./ad-request-management.component.html",
  styleUrls: ["./ad-request-management.component.scss"],
})
export class AdRequestManagementComponent implements OnInit {
  adRequests: AdRequestResponseDto[] = [];
  loading = false;
  searchTerm = "";
  totalRecords = 0;
  currentPage = 1;
  pageSize = 10;
  private isSorting = false;

  showViewDetailsDialog = false;
  showUploadAdDialog = false;
  selectedAdRequest: AdRequestResponseDto | null = null;

  selectedFile: File | null = null;
  filePreview: string | null = null;
  loadingUpload = false;

  maxFileSize = 10 * 1024 * 1024;
  acceptedFileTypes = ".jpg,.jpeg,.png,.gif,.svg,.bmp,.tiff,.pdf";

  currentFilters: FilterBoxRequestDto = {
    page: 1,
    size: 10,
    sortBy: "createdAt",
    sortDir: "desc",
  };

  constructor(
    private readonly clientService: ClientService,
    private readonly adService: AdService,
    private readonly toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadAdRequests();
  }

  loadAdRequests(): void {
    this.loading = true;
    const filters = {
      ...this.currentFilters,
      page: this.currentPage,
      size: this.pageSize,
      genericFilter: this.searchTerm,
    };

    this.clientService.getAllAdRequests(filters).subscribe({
      next: (response) => {
        this.adRequests = response.list || [];
        this.totalRecords = response.totalElements || 0;
        this.loading = false;
        this.isSorting = false;
      },
      error: (error) => {
        this.toastService.erro("Failed to load ad requests");
        this.loading = false;
        this.isSorting = false;
      },
    });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadAdRequests();
  }

  onPageChange(event: any): void {
    this.currentPage = event.page + 1;
    this.pageSize = event.rows;
    this.loadAdRequests();
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
    this.loadAdRequests();
  }

  openViewDetailsDialog(adRequest: AdRequestResponseDto): void {
    console.log(adRequest);
    this.selectedAdRequest = adRequest;
    this.showViewDetailsDialog = true;
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

      ImageValidationUtil.validateImageFile(file)
        .then((validationResult) => {
          if (!validationResult.isValid) {
            validationResult.errors.forEach((error) => {
              this.toastService.erro(error);
            });
            return;
          }

          this.selectedFile = file;
          const reader = new FileReader();
          reader.onload = () => {
            this.filePreview = reader.result as string;
          };
          reader.readAsDataURL(file);
          this.showUploadAdDialog = true;
        })
        .catch((error) => {
          this.toastService.erro("Error validating image file");
        });
    }
  }

  onFileSelect(event: any): void {
    const file = event.files[0];
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
          const reader = new FileReader();
          reader.onload = () => {
            this.filePreview = reader.result as string;
          };
          reader.readAsDataURL(file);
          this.showUploadAdDialog = true;
        })
        .catch((error) => {
          this.toastService.erro("Error validating image file");
        });
    }
  }

  isValidFileType(file: File): boolean {
    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/svg+xml",
      "image/bmp",
      "image/tiff",
    ];
    const isValidType = validTypes.includes(file.type);

    const nameRegex = /.*\.(jpg|jpeg|png|gif|svg|bmp|tiff)$/i;
    const isValidName = nameRegex.test(file.name);

    return isValidType && isValidName;
  }

  getFileType(file: File): string {
    const extension = file.name.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "jpg":
      case "jpeg":
        return "image/jpeg";
      case "png":
        return "image/png";
      case "gif":
        return "image/gif";
      case "svg":
        return "image/svg+xml";
      case "bmp":
        return "image/bmp";
      case "tiff":
        return "image/tiff";
      default:
        return "image/jpeg";
    }
  }

  uploadAd(): void {
    if (!this.selectedFile || !this.selectedAdRequest) {
      this.toastService.erro("No file selected");
      return;
    }

    this.loadingUpload = true;

    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(",")[1];

      const payload: CreateClientAdDto = {
        name: this.selectedFile!.name,
        type: this.getFileType(this.selectedFile!),
        bytes: base64Data,
      };

      this.adService
        .createClientAd(this.selectedAdRequest!.clientId, payload)
        .subscribe({
          next: () => {
            this.toastService.sucesso("Ad uploaded successfully");
            this.closeUploadAdDialog();
            this.loadAdRequests(); 
            this.loadingUpload = false;
          },
          error: (error) => {
            this.toastService.erro("Failed to upload ad");
            this.loadingUpload = false;
          },
        });
    };
    reader.readAsDataURL(this.selectedFile);
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
    window.open(link, "_blank");
  }

  downloadAttachment(link: string): void {
    const a = document.createElement("a");
    a.href = link;
    a.download = "";
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
}
