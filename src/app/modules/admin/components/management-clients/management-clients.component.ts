import { CommonModule } from "@angular/common";
import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
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
import { FileUploadPipelineService } from "@app/shared/services/file-upload-pipeline.service";
import { isPdfFile } from "@app/shared/utils/file-type.utils";
import { LazyTableController, LazyTableFilterState } from "@app/shared/utils/lazy-table.controller";
import { TableLazyPageEvent } from "@app/shared/utils/table-lazy-pagination.utils";
import { map, tap } from "rxjs/operators";
import { PdfViewerModule } from "ng2-pdf-viewer";
import { MessageService } from "primeng/api";
import { DialogService, DynamicDialogRef } from "primeng/dynamicdialog";
import { firstValueFrom, of } from "rxjs";
import { catchError, take } from "rxjs/operators";
import { MonitoringPermission } from "@app/model/monitoring-permission";
import { canAdminCreatePartner } from "@app/core/utils/admin-partner.util";
import { EditClientModalComponent } from "../edit-client-modal/edit-client-modal.component";
import { CreatePartnerModalComponent } from "../create-partner-modal/create-partner-modal.component";
import { NotificationsService } from "@app/core/service/api/notifications.service";
import { Notification } from "@app/modules/notificacao/models/notification";

@Component({
  selector: "app-management-clients",
  standalone: true,
  imports: [CommonModule, PrimengModule, FormsModule, IconSearchComponent, PdfViewerModule],
  templateUrl: "./management-clients.component.html",
  styleUrls: ["./management-clients.component.scss"],
})
export class ManagementClientsComponent implements OnInit {
  @ViewChild("fileInput") fileInput!: ElementRef<HTMLInputElement>;

  searchTerm = "";
  private operationLoading = false;

  readonly tableController: LazyTableController<
    Client,
    FilterClientRequestDto & LazyTableFilterState
  >;

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
  private unreadMessagesByClientId = new Map<string, number>();

  constructor(
    private readonly clientManagementService: ClientManagementService,
    private readonly clientService: ClientService,
    private readonly adService: AdService,
    private readonly toastService: ToastService,
    private readonly messageService: MessageService,
    private readonly confirmationDialogService: ConfirmationDialogService,
    private readonly dialogService: DialogService,
    private readonly router: Router,
    private readonly notificationsService: NotificationsService,
    public readonly fileUploadPipeline: FileUploadPipelineService
  ) {
    this.tableController = new LazyTableController<
      Client,
      FilterClientRequestDto & LazyTableFilterState
    >(
      { page: 1, size: 10, sortBy: "name", sortDir: "asc" },
      (filters) =>
        this.clientManagementService
          .getClientsWithPagination(filters as FilterClientRequestDto)
          .pipe(
          map((result) => ({
            list: result.list || [],
            totalElements: result.totalElements || 0,
          })),
          tap(() => this.sortClientsByUnreadMessages())
        ),
      () => this.toastService.erro("Failed to load clients")
    );
  }

  get clients(): Client[] {
    return this.tableController.items;
  }

  get loading(): boolean {
    return this.tableController.loading || this.operationLoading;
  }

  get totalRecords(): number {
    return this.tableController.totalRecords;
  }

  get currentFilters(): FilterClientRequestDto & LazyTableFilterState {
    return this.tableController.currentFilters;
  }

  ngOnInit(): void {
    this.refreshPanelClient();
    this.loadClients();
    this.refreshUnreadMessageCounters();
  }

  canCreatePartner(): boolean {
    return canAdminCreatePartner(this.panelClient);
  }

  private refreshPanelClient(): void {
    this.clientService
      .getAuthenticatedClient()
      .pipe(
        take(1),
        catchError(() => of(null))
      )
      .subscribe((client) => {
        if (!client) {
          return;
        }
        this.panelClient = client as Client;
        this.currentUserId = client.id ?? null;
        this.clientService.setClientAtual(this.panelClient);
      });
  }

  private hasPermanentDeleteAccess(): boolean {
    return (
      hasMonitoringPermission(
        this.panelClient,
        MonitoringPermission.ADMIN_CLIENTS_PERMANENT_DELETE
      ) ||
      hasMonitoringPermission(
        this.panelClient,
        MonitoringPermission.ADMIN_CLIENTS_SOFT_DELETE
      )
    );
  }

  refreshUnreadMessageCounters(): void {
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
      this.sortClientsByUnreadMessages();
    });
  }

  private sortClientsByUnreadMessages(): void {
    this.tableController.items = [...this.tableController.items].sort(
      (a, b) =>
        (this.getUnreadMessagesCount(b) ?? 0) - (this.getUnreadMessagesCount(a) ?? 0)
    );
  }

  getUnreadMessagesCount(client: Client): number {
    const id = client?.id;
    if (!id) return 0;
    return this.unreadMessagesByClientId.get(id) ?? 0;
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
    if (!client.id || !this.hasPermanentDeleteAccess()) {
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
    this.tableController.setSearchTerm(this.searchTerm);
    this.tableController.load();
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
    this.tableController.setSearchTerm(this.searchTerm);
    this.tableController.onSearch();
  }

  onPageChange(event: TableLazyPageEvent): void {
    this.tableController.setSearchTerm(this.searchTerm);
    this.tableController.onPageChange(event);
  }

  onSort(event: { field?: string; order?: number }): void {
    this.tableController.setSearchTerm(this.searchTerm);
    if (event.field) {
      this.tableController.currentFilters.sortBy = event.field;
      this.tableController.currentFilters.sortDir =
        event.order === 1 ? "asc" : "desc";
    }
    this.tableController.load();
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
      this.operationLoading = true;

      this.clientManagementService.makePartner(client.id!).subscribe({
        next: () => {
          this.toastService.sucesso("Client successfully made partner");
          this.loadClients();
        },
        error: (error) => {
          
          this.toastService.erro("Failed to make client partner");
          this.operationLoading = false;
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

  private getPartnerAdsCount(client: Client): number {
    const raw = client.adsCount ?? client.ads?.length ?? 0;
    return Number.isFinite(raw) ? Math.max(0, raw) : 0;
  }

  getPartnerAdsUsageLabel(client: Client): string {
    const count = Math.min(this.getPartnerAdsCount(client), this.PARTNER_MAX_ADS);
    return `${count} / ${this.PARTNER_MAX_ADS}`;
  }

  getPartnerAdsUsageClass(client: Client): string {
    const count = Math.min(this.getPartnerAdsCount(client), this.PARTNER_MAX_ADS);
    if (count >= this.PARTNER_MAX_ADS) {
      return "ads-usage ads-usage--danger";
    }
    if (count === this.PARTNER_MAX_ADS - 1) {
      return "ads-usage ads-usage--warn";
    }
    return "ads-usage";
  }

  getPartnerAdsUsageColor(client: Client): string {
    const count = Math.min(this.getPartnerAdsCount(client), this.PARTNER_MAX_ADS);
    if (count >= this.PARTNER_MAX_ADS) {
      return "var(--cor-erro)";
    }
    if (count === this.PARTNER_MAX_ADS - 1) {
      return "var(--cor-alerta)";
    }
    return "var(--cor-sucesso)";
  }

  createClient(): void {
    this.openCreatePartnerModal();
  }

  openCreatePartnerModal(): void {
    const ref: DynamicDialogRef = this.dialogService.open(
      CreatePartnerModalComponent,
      {
        header: "Create Partner",
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

    ref.onClose.subscribe((result: { success?: boolean } | undefined) => {
      if (result?.success) {
        this.loadClients();
      }
    });
  }

  editClient(client: Client): void {
    if (!client.id) {
      this.toastService.erro("Client ID not found");
      return;
    }

    this.operationLoading = true;

    this.clientService.buscarClient<Client>(client.id).subscribe({
      next: (fullClient) => {
        this.operationLoading = false;

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
            const index = this.tableController.items.findIndex((c) => c.id === client.id);
            if (index !== -1) {
              this.tableController.items[index] = {
                ...this.tableController.items[index],
                ...result.client,
              };
            }
          }
        });
      },
      error: (error) => {
        
        this.toastService.erro("Failed to load client details");
        this.operationLoading = false;
      },
    });
  }

  async restoreDeletedClient(client: Client): Promise<void> {
    const clientName = client.businessName ?? "Unknown";

    const confirmed = await this.confirmationDialogService.confirm({
      title: "Restore account",
      message: `Restore ${clientName} to active status? The user will be able to sign in again.`,
      confirmLabel: "Restore",
      cancelLabel: "Cancel",
      severity: "info",
    });

    if (!confirmed || !client.id) {
      return;
    }

    this.operationLoading = true;
    this.clientManagementService.restoreDeletedClient(client.id).subscribe({
      next: () => {
        this.toastService.sucesso("Account restored to active");
        this.loadClients();
      },
      error: (error) => {
        const msg =
          error?.error?.message ||
          error?.error?.data?.message ||
          error?.message ||
          "Failed to restore account";
        this.toastService.erro(msg);
        this.operationLoading = false;
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

    this.operationLoading = true;
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
        this.operationLoading = false;
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

    this.operationLoading = true;
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
        this.operationLoading = false;
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
    this.operationLoading = true;
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
        this.operationLoading = false;
      },
    });
  }

  async permanentDeleteClient(client: Client): Promise<void> {
    if (!client.id) {
      return;
    }
    try {
      const fresh = await firstValueFrom(this.clientService.getAuthenticatedClient());
      this.panelClient = fresh as Client;
      this.currentUserId = fresh.id ?? null;
      this.clientService.setClientAtual(this.panelClient);
    } catch {
      this.toastService.erro("Could not verify your permissions. Try again.");
      return;
    }
    if (!this.hasPermanentDeleteAccess()) {
      this.toastService.erro("You do not have permission to perform this operation.");
      return;
    }
    this.operationLoading = true;
    this.clientManagementService.getPermanentDeletionRequirements(client.id).subscribe({
      next: async (req) => {
        this.operationLoading = false;
        if (req.requiresMonitorSuccessor) {
          this.openPermanentDeleteSuccessorDialog(client, req.monitorCount);
        } else {
          await this.confirmPermanentDeleteWithoutMonitors(client);
        }
      },
      error: (error) => {
        this.operationLoading = false;
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
    this.operationLoading = true;
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
          this.operationLoading = false;
          this.showPermanentDeleteSuccessorDialog = true;
        },
        error: () => {
          this.operationLoading = false;
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
    setTimeout(() => {
      this.deletionPasswordReadonly = false;
    }, 0);
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
    this.operationLoading = true;
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
      error: (error) => {
        this.operationLoading = false;
        const msg =
          error?.error?.message ||
          error?.error?.data?.message ||
          error?.message ||
          "Failed to permanently delete account";
        this.toastService.erro(msg);
      },
    });
  }

  uploadAdForPartner(client: Client): void {
    if (!client.id) {
      this.toastService.erro("Client ID not found");
      return;
    }

    this.operationLoading = true;
    this.clientService.buscarClient<Client>(client.id).subscribe({
      next: (fullClient) => {
        this.operationLoading = false;
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
        this.operationLoading = false;
        this.toastService.erro("Failed to load client details");
      },
    });
  }

  onFileInputChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (file.size > this.maxFileSize) {
        this.toastService.erro(
          `File size exceeds maximum allowed size of ${this.fileUploadPipeline.formatFileSize(this.maxFileSize)}`
        );
        event.target.value = "";
        return;
      }

      this.fileUploadPipeline
        .validateFile(file)
        .then(async (validationResult) => {
          if (!validationResult.isValid) {
            validationResult.errors.forEach((error) => {
              this.toastService.erro(error);
            });
            event.target.value = "";
            return;
          }

          this.selectedFile = file;
          this.filePreview = await this.fileUploadPipeline.readAsDataUrl(file);
          this.showUploadAdDialog = true;
        })
        .catch(() => {
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

  isPdfAttachment(fileName: string): boolean {
    return isPdfFile(fileName);
  }

  uploadAd(): void {
    if (!this.selectedFile || !this.selectedClient?.id) {
      this.toastService.erro("No file selected");
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
      })
      .catch(() => {
        this.toastService.erro("Failed to read file");
        this.loadingUpload = false;
      });
  }

  openMessagesHistory(client: Client): void {
    if (!client.id) {
      this.toastService.erro("Client ID not found");
      return;
    }
    this.router.navigate(["/admin/clients", client.id, "messages"]);
  }
}
