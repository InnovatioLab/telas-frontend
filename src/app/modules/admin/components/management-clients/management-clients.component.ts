import { CommonModule } from "@angular/common";
import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { AdService } from "@app/core/service/api/ad.service";
import {
  ClientManagementService,
  FilterClientRequestDto,
} from "@app/core/service/api/client-management.service";
import { ClientService } from "@app/core/service/api/client.service";
import { ToastService } from "@app/core/service/state/toast.service";
import { Client, Role } from "@app/model/client";
import { CreateClientAdDto } from "@app/model/dto/request/create-client-ad.dto";
import { IconSearchComponent } from "@app/shared/icons/search.icon";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { ConfirmationDialogService } from "@app/shared/services/confirmation-dialog.service";
import { isPdfFile } from "@app/shared/utils/file-type.utils";
import { ImageValidationUtil } from "@app/utility/src/utils/image-validation.util";
import { PdfViewerModule } from "ng2-pdf-viewer";
import { MessageService } from "primeng/api";
import { DialogService, DynamicDialogRef } from "primeng/dynamicdialog";
import { EditClientModalComponent } from "../edit-client-modal/edit-client-modal.component";

@Component({
  selector: "app-management-clients",
  standalone: true,
  imports: [CommonModule, PrimengModule, FormsModule, IconSearchComponent, PdfViewerModule],
  templateUrl: "./management-clients.component.html",
  styleUrls: ["./management-clients.component.scss"],
})
export class ManagementClientsComponent implements OnInit {
  @ViewChild("fileInput") fileInput!: ElementRef<HTMLInputElement>;

  clients: Client[] = [];
  loading = false;
  searchTerm = "";
  totalRecords = 0;
  currentPage = 1;
  pageSize = 10;
  currentFilters: FilterClientRequestDto = {
    page: 1,
    size: 10,
    sortBy: "name",
    sortDir: "asc",
  };

  showUploadAdDialog = false;
  selectedClient: Client | null = null;
  selectedFile: File | null = null;
  filePreview: string | null = null;
  loadingUpload = false;
  maxFileSize = 10 * 1024 * 1024;
  acceptedFileTypes = ".jpg,.jpeg,.png,.gif,.svg,.bmp,.tiff,.pdf";
  readonly PARTNER_MAX_ADS = 7;

  constructor(
    private readonly clientManagementService: ClientManagementService,
    private readonly clientService: ClientService,
    private readonly adService: AdService,
    private readonly toastService: ToastService,
    private readonly messageService: MessageService,
    private readonly confirmationDialogService: ConfirmationDialogService,
    private readonly dialogService: DialogService
  ) {}

  ngOnInit(): void {
    this.loadClients();
  }

  loadClients(): void {
    this.loading = true;

    const filters: FilterClientRequestDto = {
      page: this.currentFilters.page || 1,
      size: this.currentFilters.size || 10,
      sortBy: this.currentFilters.sortBy || "name",
      sortDir: this.currentFilters.sortDir || "asc",
    };

    if (this.currentFilters.genericFilter) {
      filters.genericFilter = this.currentFilters.genericFilter;
    }

    this.clientManagementService.getClientsWithPagination(filters).subscribe({
      next: (result) => {
        this.clients = result.list || [];
        this.totalRecords = result.totalElements || 0;
        this.loading = false;
      },
      error: (error) => {
        
        this.toastService.erro("Failed to load clients");
        this.loading = false;
      },
    });
  }

  onSearch(): void {
    this.currentFilters.page = 1;
    this.currentFilters.genericFilter = this.searchTerm.trim();
    this.loadClients();
  }

  onPageChange(event: any): void {
    this.currentFilters.page = event.page + 1;
    this.currentFilters.size = event.rows;
    this.loadClients();
  }

  onSort(event: any): void {
    this.currentFilters.sortBy = event.field;
    this.currentFilters.sortDir = event.order === 1 ? "asc" : "desc";
    this.loadClients();
  }

  async makePartner(client: Client): Promise<void> {
    const clientName = client.businessName ?? "Unknown";

    const confirmed = await this.confirmationDialogService.confirm({
      title: "Make Partner",
      message: `Are you sure you want to make ${clientName} a partner?`,
      confirmLabel: "Make Partner",
      cancelLabel: "Cancel",
      severity: "info",
    });

    if (confirmed) {
      this.loading = true;

      this.clientManagementService.makePartner(client.id!).subscribe({
        next: () => {
          this.toastService.sucesso("Client successfully made partner");

          const index = this.clients.findIndex((c) => c.id === client.id);

          if (index !== -1) {
            this.clients[index] = {
              ...this.clients[index],
              role: Role.PARTNER,
            };
          }
          this.loading = false;
        },
        error: (error) => {
          
          this.toastService.erro("Failed to make client partner");
          this.loading = false;
        },
      });
    }
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

  createClient(): void {
    this.toastService.sucesso(
      "Create client functionality will be implemented"
    );
  }

  editClient(client: Client): void {
    if (!client.id) {
      this.toastService.erro("Client ID not found");
      return;
    }

    this.loading = true;

    this.clientService.buscarClient<Client>(client.id).subscribe({
      next: (fullClient) => {
        this.loading = false;

        const ref: DynamicDialogRef = this.dialogService.open(
          EditClientModalComponent,
          {
            data: { client: fullClient },
            header: "Edit Client",
            closable: true,
            closeOnEscape: true,
            draggable: false,
            resizable: false,

            contentStyle: {
              overflow: "auto",
              padding: "0",
              display: "flex",
              "flex-direction": "column",
              width: "98vw",
              "max-width": "800px",
            },
            baseZIndex: 10000,
          }
        );

        ref.onClose.subscribe((result: any) => {
          if (result && result.success) {
            const index = this.clients.findIndex((c) => c.id === client.id);
            if (index !== -1) {
              this.clients[index] = {
                ...this.clients[index],
                ...result.client,
              };
            }
          }
        });
      },
      error: (error) => {
        
        this.toastService.erro("Failed to load client details");
        this.loading = false;
      },
    });
  }

  async deleteClient(client: Client): Promise<void> {
    const clientName = client.businessName ?? "Unknown";

    const confirmed = await this.confirmationDialogService.confirm({
      title: "Delete Client",
      message: `Are you sure you want to delete client ${clientName}?`,
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      severity: "error",
    });

    if (confirmed) {
      this.toastService.sucesso(
        "Delete client functionality will be implemented"
      );
    }
  }

  uploadAdForPartner(client: Client): void {
    if (!client.id) {
      this.toastService.erro("Client ID not found");
      return;
    }

    this.loading = true;
    this.clientService.buscarClient<Client>(client.id).subscribe({
      next: (fullClient) => {
        this.loading = false;
        const adsCount = fullClient.ads?.length || 0;

        if (adsCount >= this.PARTNER_MAX_ADS) {
          this.toastService.erro(
            `This partner already has ${this.PARTNER_MAX_ADS} ads. Maximum limit reached.`
          );
          return;
        }

        this.selectedClient = fullClient;
        this.fileInput.nativeElement.click();
      },
      error: (error) => {
        this.loading = false;
        this.toastService.erro("Failed to load client details");
      },
    });
  }

  onFileInputChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (file.size > this.maxFileSize) {
        this.toastService.erro(
          `File size exceeds maximum allowed size of ${this.formatFileSize(this.maxFileSize)}`
        );
        event.target.value = "";
        return;
      }

      ImageValidationUtil.validateImageFile(file)
        .then((validationResult) => {
          if (!validationResult.isValid) {
            validationResult.errors.forEach((error) => {
              this.toastService.erro(error);
            });
            event.target.value = "";
            return;
          }

          this.selectedFile = file;
          const reader = new FileReader();
          reader.onload = () => {
            this.filePreview = reader.result as string;
            this.showUploadAdDialog = true;
          };
          reader.readAsDataURL(file);
        })
        .catch((error) => {
          this.toastService.erro("Error validating file");
          event.target.value = "";
        });
    }
  }

  closeUploadAdDialog(): void {
    this.showUploadAdDialog = false;
    this.selectedClient = null;
    this.selectedFile = null;
    this.filePreview = null;
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
      case "pdf":
        return "application/pdf";
      default:
        return "image/jpeg";
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  }

  isPdfAttachment(fileName: string): boolean {
    return isPdfFile(fileName);
  }

  uploadAd(): void {
    if (!this.selectedFile || !this.selectedClient?.id) {
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

      this.adService.createClientAd(this.selectedClient!.id!, payload).subscribe({
        next: () => {
          this.toastService.sucesso("Ad uploaded successfully");
          this.closeUploadAdDialog();
          this.loadClients();
          this.loadingUpload = false;
        },
        error: (error) => {
          this.toastService.erro(
            error?.error?.message || error?.message || "Failed to upload ad"
          );
          this.loadingUpload = false;
        },
      });
    };
    reader.readAsDataURL(this.selectedFile);
  }
}
