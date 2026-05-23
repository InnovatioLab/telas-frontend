import { Component, OnInit } from "@angular/core";
import { ToastService } from "@app/core/service/state/toast.service";

import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import {
  FilterSubscriptionRequestDto,
  SubscriptionService,
} from "@app/core/service/api/subscription.service";
import { SubscriptionMinResponseDto } from "@app/model/dto/response/subscription-response.dto";
import { Recurrence } from "@app/model/enums/recurrence.enum";
import { SubscriptionStatus } from "@app/model/enums/subscription-status.enum";
import { IconsModule } from "@app/shared/icons/icons.module";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { ConfirmationDialogService } from "@app/shared/services/confirmation-dialog.service";
import { LazyTableController, LazyTableFilterState } from "@app/shared/utils/lazy-table.controller";
import { TableLazyPageEvent } from "@app/shared/utils/table-lazy-pagination.utils";
import { map } from "rxjs/operators";

@Component({
  selector: "app-management-subscriptions",
  templateUrl: "./management-subscriptions.component.html",
  styleUrls: ["./management-subscriptions.component.scss"],
  standalone: true,
  imports: [CommonModule, PrimengModule, IconsModule, FormsModule],
})
export class ManagementSubscriptionsComponent implements OnInit {
  selectedSubscriptionForUpgrade: SubscriptionMinResponseDto | null = null;
  showUpgradeDialog = false;

  recurrenceOptions = [
    { label: "30 Days", value: Recurrence.THIRTY_DAYS },
    { label: "60 Days", value: Recurrence.SIXTY_DAYS },
    { label: "90 Days", value: Recurrence.NINETY_DAYS },
    { label: "Monthly", value: Recurrence.MONTHLY },
  ];

  availableUpgradeOptions: { label: string; value: Recurrence }[] = [];
  selectedUpgradeRecurrence: Recurrence | null = null;

  searchTerm = "";
  private operationLoading = false;

  readonly tableController: LazyTableController<
    SubscriptionMinResponseDto,
    FilterSubscriptionRequestDto & LazyTableFilterState
  >;

  constructor(
    private readonly toastService: ToastService,
    private readonly subscriptionService: SubscriptionService,
    private readonly dialogService: ConfirmationDialogService,
    private readonly route: ActivatedRoute
  ) {
    this.tableController = new LazyTableController<
      SubscriptionMinResponseDto,
      FilterSubscriptionRequestDto & LazyTableFilterState
    >(
      { page: 1, size: 10, sortBy: "startedAt", sortDir: "desc" },
      (filters) =>
        this.subscriptionService
          .getClientSubscriptionsFilters(filters as FilterSubscriptionRequestDto)
          .pipe(
          map((result) => ({
            list: result.list || [],
            totalElements: this.ensureValidNumber(
              result.totalElements ?? result.totalRecords ?? 0
            ),
          }))
        )
    );
  }

  get loading(): boolean {
    return this.tableController.loading || this.operationLoading;
  }

  get subscriptions(): SubscriptionMinResponseDto[] {
    return this.tableController.items;
  }

  get totalRecords(): number {
    return this.tableController.totalRecords;
  }

  get currentFilters(): FilterSubscriptionRequestDto & LazyTableFilterState {
    return this.tableController.currentFilters;
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const uuid = params.get("uuid");
      if (uuid) {
        this.searchTerm = uuid;
        this.loadSubscriptions();
      } else {
        this.loadInitialData();
      }
    });
  }

  loadInitialData(): void {
    this.tableController.setSearchTerm(this.searchTerm);
    this.tableController.load();
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

  loadSubscriptions(): void {
    this.tableController.setSearchTerm(this.searchTerm);
    this.tableController.load();
  }

  getSubscriptionLocations(subscription: SubscriptionMinResponseDto): string {
    if (
      !subscription ||
      !subscription.monitors ||
      subscription.monitors.length === 0
    ) {
      return "N/A";
    }

    return subscription.monitors
      .map((monitor) => monitor.addressData)
      .filter((addr) => addr && addr.trim() !== "")
      .join(" ");
  }

  getSubscriptionStatusSeverity(
    status: SubscriptionStatus
  ): "info" | "success" | "warn" | "danger" | "secondary" | "contrast" {
    switch (status) {
      case SubscriptionStatus.ACTIVE:
        return "success";
      case SubscriptionStatus.PENDING:
        return "secondary";
      case SubscriptionStatus.EXPIRED:
        return "danger";
      case SubscriptionStatus.CANCELLED:
        return "danger";
      default:
        return "info";
    }
  }

  getSubscriptionStatusLabel(subscription: SubscriptionMinResponseDto): string {
    const status = subscription?.status;
    const base =
      status && typeof status === "string"
        ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
        : "";
    if (status === SubscriptionStatus.ACTIVE && subscription.cancelAtPeriodEnd) {
      return `${base} (cancel scheduled)`;
    }
    return base;
  }

  getDaysLeftSeverity(
    daysLeft: number
  ): "info" | "success" | "warn" | "danger" | "secondary" | "contrast" {
    if (daysLeft >= 30) {
      return "success";
    }

    if (daysLeft < 30 && daysLeft >= 14) {
      return "warn";
    }

    return "danger";
  }

  onUpgradeMode(subscription: SubscriptionMinResponseDto): void {
    this.selectedSubscriptionForUpgrade = subscription;

    if (subscription.status !== SubscriptionStatus.ACTIVE) {
      this.toastService.aviso("You can only upgrade active subscriptions.");
      return;
    }

    if (!subscription.ableToUpgrade) {
      this.toastService.aviso("This subscription cannot be upgraded.");
      return;
    }

    this.availableUpgradeOptions = this.getAvailableUpgradeOptions(
      subscription.recurrence
    );

    if (this.availableUpgradeOptions.length === 0) {
      this.toastService.aviso(
        "No upgrade options available for this subscription."
      );
      return;
    }

    this.selectedUpgradeRecurrence = null;

    // Show upgrade dialog
    this.showUpgradeDialog = true;
  }

  getAvailableUpgradeOptions(
    currentRecurrence: Recurrence
  ): { label: string; value: Recurrence }[] {
    const upgradeMap: Record<
      Recurrence,
      { label: string; value: Recurrence }[]
    > = {
      [Recurrence.THIRTY_DAYS]: [
        { label: "60 Days", value: Recurrence.SIXTY_DAYS },
        { label: "90 Days", value: Recurrence.NINETY_DAYS },
        { label: "Monthly", value: Recurrence.MONTHLY },
      ],
      [Recurrence.SIXTY_DAYS]: [
        { label: "90 Days", value: Recurrence.NINETY_DAYS },
        { label: "Monthly", value: Recurrence.MONTHLY },
      ],
      [Recurrence.NINETY_DAYS]: [
        { label: "Monthly", value: Recurrence.MONTHLY },
      ],
      [Recurrence.MONTHLY]: [], // No upgrades available for monthly
    };

    return upgradeMap[currentRecurrence] || [];
  }

  confirmUpgrade(): void {
    if (
      !this.selectedSubscriptionForUpgrade ||
      !this.selectedUpgradeRecurrence
    ) {
      this.toastService.aviso("Please select an upgrade option.");
      return;
    }

    this.operationLoading = true;

    this.subscriptionService
      .upgrade(
        this.selectedSubscriptionForUpgrade.id,
        this.selectedUpgradeRecurrence
      )
      .subscribe({
        next: (checkoutUrl) => {
          this.operationLoading = false;
          if (!checkoutUrl) {
            this.toastService.aviso("No checkout URL returned for upgrade.");
            return;
          }

          this.hideUpgradeDialog();

          window.location.href = checkoutUrl;
        },
        error: () => {
          this.operationLoading = false;
        },
      });
  }

  initiateRenewCheckout(subscription: SubscriptionMinResponseDto): void {
    this.operationLoading = true;

    this.subscriptionService.renew(subscription.id).subscribe({
      next: (checkoutUrl) => {
        if (!checkoutUrl) {
          this.toastService.aviso("No checkout URL returned for renewal.");
          return;
        }

        window.location.href = checkoutUrl;
      },
      error: () => {},
    });
  }

  initiateCustomerPortalSession(): void {
    this.operationLoading = true;

    this.subscriptionService.getCustomerPortalUrl().subscribe({
      next: (portalUrl) => {
        if (!portalUrl) {
          this.toastService.aviso("No URL returned for customer portal.");
          this.operationLoading = false;
          return;
        }
        this.operationLoading = false;

        window.location.href = portalUrl;
      },
      error: (error) => {
        this.operationLoading = false;
        if ((error as any)?.handled) {
          return;
        }
        const errorMessage =
          typeof error === "string"
            ? error
            : error?.message || "An error occurred";
        if (
          errorMessage.includes("permission") ||
          errorMessage.includes("You do not have permission") ||
          errorMessage ===
            "You do not have permission to perform this operation."
        ) {
          return;
        }
        // toast já é exibido pelo interceptor global
      },
    });
  }

  hideUpgradeDialog(): void {
    this.showUpgradeDialog = false;
    this.selectedSubscriptionForUpgrade = null;
    this.selectedUpgradeRecurrence = null;
    this.availableUpgradeOptions = [];
  }

  getRecurrenceLabel(recurrence: Recurrence): string {
    const option = this.recurrenceOptions.find(
      (opt) => opt.value === recurrence
    );
    return option ? option.label : "Unknown";
  }

  getDaysLeftDisplay(daysLeft: number): string {
    if (daysLeft === 0) {
      return "Today";
    }

    return daysLeft.toString() + " days";
  }

  async cancelSubscription(
    subscription: SubscriptionMinResponseDto
  ): Promise<void> {
    if (subscription.cancelAtPeriodEnd) {
      const effectiveAt = subscription.cancelAtPeriodEndAt || subscription.endsAt;
      const effectiveLabel = effectiveAt
        ? `Cancelamento agendado para ${new Date(effectiveAt).toLocaleDateString()}.`
        : "Cancelamento já está agendado para esta assinatura.";
      this.toastService.aviso(effectiveLabel);
      return;
    }
    const locations = this.getSubscriptionLocations(subscription);
    const confirmed = await this.dialogService.confirm({
      title: "Cancel Subscription",
      message: `<p class="mb-0">Are you sure you want to cancel subscription with locations:</p> <small>${locations}.</small> <p class="mb-0">Your ads will be displayed until the end of the billing cycle.</p>`,
      confirmLabel: "Cancel",
      cancelLabel: "Keep",
      severity: "error",
    });

    if (confirmed) {
      this.subscriptionService.delete(subscription.id).subscribe({
        next: (ok) => {
          if (!ok) {
            this.toastService.erro("Não foi possível cancelar a assinatura.");
            return;
          }
          subscription.ableToCancel = false;
          if (subscription.recurrence === Recurrence.MONTHLY) {
            subscription.cancelAtPeriodEnd = true;
            subscription.cancelRequestedAt = new Date().toISOString();
          }
          const msg =
            subscription.recurrence === Recurrence.MONTHLY
              ? "Cancelamento agendado para o fim do período de cobrança. Veja a data na tabela."
              : "Subscription cancelled successfully.";
          this.toastService.sucesso(msg);
          this.loadSubscriptions();
        },
        error: () => {},
      });
    }
  }
}
