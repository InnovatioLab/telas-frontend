import { CommonModule } from "@angular/common";
import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { AdService } from "@app/core/service/api/ad.service";
import {
  ClientManagementService,
  FilterClientRequestDto,
  PermanentDeleteClientPayload,
} from "@app/core/service/api/client-management.service";
import { ClientService } from "@app/core/service/api/client.service";
import { hasMonitoringPermission } from "@app/core/utils/monitoring-permission.util";
import { ToastService } from "@app/core/service/state/toast.service";
import {
  Address,
  Client,
  DefaultStatus,
  Role,
  isPrivilegedPanelRole,
} from "@app/model/client";
import { CreateClientAdDto } from "@app/model/dto/request/create-client-ad.dto";
import { IconSearchComponent } from "@app/shared/icons/search.icon";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { ConfirmationDialogService } from "@app/shared/services/confirmation-dialog.service";
import { isPdfFile } from "@app/shared/utils/file-type.utils";
import { ImageValidationUtil } from "@app/utility/src/utils/image-validation.util";
import { PdfViewerModule } from "ng2-pdf-viewer";
import { MessageService } from "primeng/api";
import { DialogService, DynamicDialogRef } from "primeng/dynamicdialog";
import { of } from "rxjs";
import { switchMap, take } from "rxjs/operators";
import { MonitoringPermission } from "@app/model/monitoring-permission";
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
  readonly PARTNER_MAX_ADS = 5;

  showPermanentDeleteSuccessorDialog = false;
  permanentDeleteDialogClient: Client | null = null;
  permanentDeleteMonitorCount = 0;
  successorCandidates: Client[] = [];
  selectedSuccessorId: string | null = null;
  adminDeletionPassword = "";
  deletionPasswordReadonly = true;

  showPermanentDeleteSimpleDialog = false;
  pendingSimplePermanentDeleteClient: Client | null = null;

  currentUserId: string | null = null;
  private panelClient: Client | null = null;

  private readonly addressesByClientId = new Map<string, Address[]>();
  private readonly addressesLoadingByClientId = new Set<string>();

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
    this.clientService.clientAtual$
      .pipe(
        take(1),
        switchMap((c) => (c ? of(c) : this.clientService.getAuthenticatedClient()))
      )
      .subscribe((client) => {
        this.panelClient = (client as Client) ?? null;
        this.currentUserId = client?.id ?? null;
      });
    this.loadClients();
  }

  canDeactivateClient(client: Client): boolean {
    if (
      !client.id ||
      !hasMonitoringPermission(
        this.panelClient,
        MonitoringPermission.ADMIN_CLIENTS_DEACTIVATE
      )
    ) {
      return false;
    }
    if (client.id === this.currentUserId) {
      return false;
    }
    if (isPrivilegedPanelRole(client.role)) {
      return false;
    }
    if (
      client.status === DefaultStatus.INACTIVE ||
      client.status === DefaultStatus.DELETED
    ) {
      return false;
    }
    return true;
  }

  canSoftDeleteClient(client: Client): boolean {
    if (
      !client.id ||
      !hasMonitoringPermission(
        this.panelClient,
        MonitoringPermission.ADMIN_CLIENTS_SOFT_DELETE
      )
    ) {
      return false;
    }
    if (client.id === this.currentUserId) {
      return false;
    }
    if (isPrivilegedPanelRole(client.role)) {
      return false;
    }
    if (client.status === DefaultStatus.DELETED) {
      return false;
    }
    return true;
  }

  canPermanentDeleteClient(client: Client): boolean {
    if (
      !client.id ||
      !hasMonitoringPermission(
        this.panelClient,
        MonitoringPermission.ADMIN_CLIENTS_PERMANENT_DELETE
      )
    ) {
      return false;
    }
    if (client.id === this.currentUserId) {
      return false;
    }
    if (isPrivilegedPanelRole(client.role)) {
      return false;
    }
    return client.status === DefaultStatus.DELETED;
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

  async ensureClientAddressesLoaded(client: Client): Promise<void> {
    const clientId = client.id;
    if (!clientId) return;
    if (this.addressesByClientId.has(clientId)) return;
    if (this.addressesLoadingByClientId.has(clientId)) return;

    this.addressesLoadingByClientId.add(clientId);
    this.clientService.buscarClient<Client>(clientId).subscribe({
      next: (fullClient) => {
        this.addressesByClientId.set(clientId, fullClient.addresses ?? []);
        this.addressesLoadingByClientId.delete(clientId);
      },
      error: () => {
        this.addressesLoadingByClientId.delete(clientId);
      },
    });
  }

  getClientAddresses(client: Client): Address[] {
    const clientId = client.id;
    if (!clientId) return [];
    return this.addressesByClientId.get(clientId) ?? [];
  }

  getFirstAddressText(client: Client): string {
    const addresses = this.getClientAddresses(client);
    if (addresses.length > 0) {
      return this.formatAddress(addresses[0]);
    }
    return client.partnerAddressSummary?.trim() ? client.partnerAddressSummary : "—";
  }

  getAddressesTooltipHtml(client: Client): string {
    const addresses = this.getClientAddresses(client);
    if (addresses.length === 0) {
      const summary = client.partnerAddressSummary?.trim();
      return summary ? summary : "—";
    }
    return addresses
      .map((addr, idx) => `${idx + 1}. ${this.formatAddress(addr)}`)
      .join("<br/>");
  }

  getAddressesTooltipText(client: Client): string {
    const addresses = this.getClientAddresses(client);
    if (addresses.length === 0) {
      const summary = client.partnerAddressSummary?.trim();
      return summary ? summary : "—";
    }
    return addresses
      .map((addr, idx) => `${idx + 1}. ${this.formatAddress(addr)}`)
      .join("\n");
  }

  getExtraAddressesCount(client: Client): number {
    const addresses = this.getClientAddresses(client);
    return Math.max(0, addresses.length - 1);
  }

  private formatAddress(addr: Address): string {
    const parts = [
      addr.street,
      addr.city,
      addr.state,
      addr.zipCode,
      addr.country,
    ]
      .map((v) => (typeof v === "string" ? v.trim() : ""))
      .filter((v) => Boolean(v));

    return parts.length > 0 ? parts.join(", ") : "—";
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
          this.loadClients();
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

  async reactivateClient(client: Client): Promise<void> {
    const clientName = client.businessName ?? "Unknown";

    const confirmed = await this.confirmationDialogService.confirm({
      title: "Reactivate user",
      message: `Reactivate the account ${clientName}? The user will be able to sign in again.`,
      confirmLabel: "Reactivate",
      cancelLabel: "Cancel",
      severity: "info",
    });

    if (!confirmed || !client.id) {
      return;
    }

    this.loading = true;
    this.clientManagementService.reactivateClient(client.id).subscribe({
      next: () => {
        this.toastService.sucesso("User reactivated successfully");
        this.loadClients();
      },
      error: (error) => {
        const msg =
          error?.error?.message ||
          error?.error?.data?.message ||
          error?.message ||
          "Failed to reactivate user";
        this.toastService.erro(msg);
        this.loading = false;
      },
    });
  }

  async deactivateClient(client: Client): Promise<void> {
    const clientName = client.businessName ?? "Unknown";

    const confirmed = await this.confirmationDialogService.confirm({
      title: "Inactivate user",
      message: `This will logically delete the account (status inactive). The user ${clientName} will not be able to sign in. Continue?`,
      confirmLabel: "Inactivate",
      cancelLabel: "Cancel",
      severity: "warn",
    });

    if (!confirmed || !client.id) {
      return;
    }

    this.loading = true;
    this.clientManagementService.deactivateClient(client.id).subscribe({
      next: () => {
        this.toastService.sucesso("User inactivated successfully");
        this.loadClients();
      },
      error: (error) => {
        const msg =
          error?.error?.message ||
          error?.error?.data?.message ||
          error?.message ||
          "Failed to inactivate user";
        this.toastService.erro(msg);
        this.loading = false;
      },
    });
  }

  async softDeleteClient(client: Client): Promise<void> {
    const clientName = client.businessName ?? "Unknown";
    const confirmed = await this.confirmationDialogService.confirm({
      title: "Mark account as deleted",
      message: `This will mark ${clientName} as deleted. The user will not be able to sign in.`,
      confirmLabel: "Confirm",
      cancelLabel: "Cancel",
      severity: "error",
    });
    if (!confirmed || !client.id) {
      return;
    }
    this.loading = true;
    this.clientManagementService.softDeleteClient(client.id).subscribe({
      next: () => {
        this.toastService.sucesso("Account marked as deleted");
        this.loadClients();
      },
      error: (error) => {
        const msg =
          error?.error?.message ||
          error?.error?.data?.message ||
          error?.message ||
          "Failed to update account";
        this.toastService.erro(msg);
        this.loading = false;
      },
    });
  }

  async permanentDeleteClient(client: Client): Promise<void> {
    if (!client.id) {
      return;
    }
    this.loading = true;
    this.clientManagementService.getPermanentDeletionRequirements(client.id).subscribe({
      next: async (req) => {
        this.loading = false;
        if (req.requiresMonitorSuccessor) {
          this.openPermanentDeleteSuccessorDialog(client, req.monitorCount);
        } else {
          await this.confirmPermanentDeleteWithoutMonitors(client);
        }
      },
      error: (error) => {
        this.loading = false;
        const msg =
          error?.error?.message ||
          error?.error?.data?.message ||
          error?.message ||
          "Failed to check deletion requirements";
        this.toastService.erro(msg);
      },
    });
  }

  private openPermanentDeleteSuccessorDialog(client: Client, monitorCount: number): void {
    this.armDeletionPasswordField();
    this.permanentDeleteDialogClient = client;
    this.permanentDeleteMonitorCount = monitorCount;
    this.selectedSuccessorId = null;
    this.successorCandidates = [];
    this.loading = true;
    this.clientManagementService
      .getClientsWithPagination({
        page: 1,
        size: 500,
        sortBy: "name",
        sortDir: "asc",
      })
      .subscribe({
        next: (result) => {
          this.successorCandidates = (result.list || []).filter((c) =>
            this.isPermanentDeleteSuccessorCandidate(c, client)
          );
          this.loading = false;
          this.showPermanentDeleteSuccessorDialog = true;
        },
        error: () => {
          this.loading = false;
          this.toastService.erro("Failed to load clients for successor selection");
        },
      });
  }

  private isPermanentDeleteSuccessorCandidate(candidate: Client, victim: Client): boolean {
    if (!candidate.id || candidate.id === victim.id) {
      return false;
    }
    if (candidate.status !== DefaultStatus.ACTIVE) {
      return false;
    }
    if (isPrivilegedPanelRole(candidate.role)) {
      return false;
    }
    return true;
  }

  private confirmPermanentDeleteWithoutMonitors(client: Client): void {
    if (!client.id) {
      return;
    }
    this.pendingSimplePermanentDeleteClient = client;
    this.armDeletionPasswordField();
    this.showPermanentDeleteSimpleDialog = true;
  }

  armDeletionPasswordField(): void {
    this.adminDeletionPassword = "";
    this.deletionPasswordReadonly = true;
  }

  onDeletionPasswordFocus(): void {
    this.deletionPasswordReadonly = false;
  }

  closePermanentDeleteSimpleDialog(): void {
    this.showPermanentDeleteSimpleDialog = false;
    this.pendingSimplePermanentDeleteClient = null;
    this.adminDeletionPassword = "";
    this.deletionPasswordReadonly = true;
  }

  confirmPermanentDeleteSimplePassword(): void {
    const pwd = this.adminDeletionPassword.trim();
    if (!pwd) {
      this.toastService.erro("Enter your password to confirm");
      return;
    }
    const victim = this.pendingSimplePermanentDeleteClient;
    if (!victim?.id) {
      return;
    }
    this.runPermanentDeleteRequest(victim.id, null, pwd);
  }

  closePermanentDeleteSuccessorDialog(): void {
    this.showPermanentDeleteSuccessorDialog = false;
    this.permanentDeleteDialogClient = null;
    this.selectedSuccessorId = null;
    this.successorCandidates = [];
    this.adminDeletionPassword = "";
    this.deletionPasswordReadonly = true;
  }

  confirmPermanentDeleteWithSuccessor(): void {
    if (!this.permanentDeleteDialogClient?.id || !this.selectedSuccessorId) {
      this.toastService.erro("Select the client who will inherit the screens");
      return;
    }
    const pwd = this.adminDeletionPassword.trim();
    if (!pwd) {
      this.toastService.erro("Enter your password to confirm");
      return;
    }
    const victimId = this.permanentDeleteDialogClient.id;
    const successorId = this.selectedSuccessorId;
    this.runPermanentDeleteRequest(victimId, successorId, pwd);
  }

  private runPermanentDeleteRequest(
    victimId: string,
    monitorSuccessorId: string | null,
    password: string
  ): void {
    this.loading = true;
    const payload: PermanentDeleteClientPayload = { password };
    if (monitorSuccessorId) {
      payload.monitorSuccessorClientId = monitorSuccessorId;
    }
    this.clientManagementService.permanentDeleteClient(victimId, payload).subscribe({
      next: () => {
        this.toastService.sucesso("Account removed");
        this.armDeletionPasswordField();
        this.closePermanentDeleteSuccessorDialog();
        this.closePermanentDeleteSimpleDialog();
        this.loadClients();
      },
      error: () => {
        this.loading = false;
      },
    });
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
