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

@Component({
  selector: "app-management-subscriptions",
  templateUrl: "./management-subscriptions.component.html",
  styleUrls: ["./management-subscriptions.component.scss"],
  standalone: true,
  imports: [CommonModule, PrimengModule, IconsModule, FormsModule],
})
export class ManagementSubscriptionsComponent implements OnInit {
  loading = false;
  subscriptions: SubscriptionMinResponseDto[] = [];
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
  isSorting = false;
  totalRecords = 0;
  currentPage = 1;
  pageSize = 10;

  currentFilters: FilterSubscriptionRequestDto = {
    page: 1,
    size: 10,
    sortBy: "startedAt",
    sortDir: "desc",
  };

  constructor(
    private readonly toastService: ToastService,
    private readonly subscriptionService: SubscriptionService,
    private readonly dialogService: ConfirmationDialogService,
    private readonly route: ActivatedRoute
  ) {}

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
    this.loading = true;

    const filters: FilterSubscriptionRequestDto = { ...this.currentFilters };

    if (this.searchTerm.trim()) {
      filters.genericFilter = this.searchTerm.trim();
    }

    this.subscriptionService.getClientSubscriptionsFilters(filters).subscribe({
      next: (result) => {
        this.subscriptions = result.list || [];
        this.totalRecords = this.ensureValidNumber(
          result.totalElements ?? (result as any).totalRecords ?? 0
        );
        this.loading = false;
      },
      error: (error) => {
        this.toastService.erro(error);
        this.loading = false;
      },
    });
  }

  ensureValidNumber(value: any): number {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  }

  onSearch(): void {
    this.currentFilters.page = 1;
    this.loadSubscriptions();
  }

  onPageChange(event: any): void {
    this.currentFilters.page = event.page + 1;
    this.currentFilters.size = event.rows;
    this.loadSubscriptions();
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
    this.loadSubscriptions();
  }

  loadSubscriptions(): void {
    this.loading = true;

    const filters: FilterSubscriptionRequestDto = { ...this.currentFilters };

    if (this.searchTerm.trim()) {
      filters.genericFilter = this.searchTerm.trim();
    }

    this.subscriptionService.getClientSubscriptionsFilters(filters).subscribe({
      next: (result) => {
        this.subscriptions = result.list || [];
        this.totalRecords = this.ensureValidNumber(
          result.totalElements ?? result.totalRecords ?? 0
        );
        this.loading = false;
        this.isSorting = false;
      },
      error: (error) => {
        this.toastService.erro(error);
        this.loading = false;
        this.isSorting = false;
      },
    });
  }

  getSubscriptionLocations(subscription: SubscriptionMinResponseDto): string[] {
    if (
      !subscription ||
      !subscription.monitors ||
      subscription.monitors.length === 0
    ) {
      return ["N/A"];
    }

    return subscription.monitors
      .map((monitor) => monitor.addressData)
      .filter((addr) => addr && addr.trim() !== "");
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

    this.loading = true;

    this.subscriptionService
      .upgrade(
        this.selectedSubscriptionForUpgrade.id,
        this.selectedUpgradeRecurrence
      )
      .subscribe({
        next: (checkoutUrl) => {
          this.loading = false;
          if (!checkoutUrl) {
            this.toastService.aviso("No checkout URL returned for upgrade.");
            return;
          }

          this.hideUpgradeDialog();

          window.location.href = checkoutUrl;
        },
        error: (error) => {
          this.loading = false;
          this.toastService.erro(error);
        },
      });
  }

  initiateRenewCheckout(subscription: SubscriptionMinResponseDto): void {
    this.loading = true;

    this.subscriptionService.renew(subscription.id).subscribe({
      next: (checkoutUrl) => {
        if (!checkoutUrl) {
          this.toastService.aviso("No checkout URL returned for renewal.");
          return;
        }

        window.location.href = checkoutUrl;
      },
      error: (error) => {
        this.toastService.erro(error);
      },
    });
  }

  initiateCustomerPortalSession(): void {
    this.loading = true;

    this.subscriptionService.getCustomerPortalUrl().subscribe({
      next: (portalUrl) => {
        if (!portalUrl) {
          this.toastService.aviso("No URL returned for customer portal.");
          this.loading = false;
          return;
        }
        this.loading = false;

        window.location.href = portalUrl;
      },
      error: (error) => {
        this.loading = false;
        if ((error as any)?.handled) {
          return;
        }
        const errorMessage = typeof error === 'string' ? error : error?.message || 'An error occurred';
        if (errorMessage.includes('permission') || errorMessage.includes('You do not have permission') || errorMessage === 'You do not have permission to perform this operation.') {
          return;
        }
        this.toastService.erro(errorMessage);
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
        next: () => {
          this.toastService.sucesso("Subscription cancelled successfully.");
          this.loadSubscriptions();
        },
        error: (error) => {
          this.toastService.erro(error);
        },
      });
    }
  }
}
