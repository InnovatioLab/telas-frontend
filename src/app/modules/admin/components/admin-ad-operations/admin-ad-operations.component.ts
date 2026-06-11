import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { AdminAdOperationsService } from "@app/core/service/api/admin-ad-operations.service";
import { ToastService } from "@app/core/service/state/toast.service";
import {
  AdminAdOperationRow,
  AdminAdOperationsFilter,
  AdminExpiryNotification,
  AdminUrgencyLevel,
} from "@app/model/admin-ad-operations";
import { IconSearchComponent } from "@app/shared/icons/search.icon";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { LazyTableController, LazyTableFilterState } from "@app/shared/utils/lazy-table.controller";
import { TableLazyPageEvent } from "@app/shared/utils/table-lazy-pagination.utils";
import { map } from "rxjs/operators";

@Component({
  selector: "app-admin-ad-operations",
  standalone: true,
  imports: [
    CommonModule,
    PrimengModule,
    FormsModule,
    RouterModule,
    IconSearchComponent,
  ],
  templateUrl: "./admin-ad-operations.component.html",
  styleUrls: ["./admin-ad-operations.component.scss"],
})
export class AdminAdOperationsComponent implements OnInit {
  searchTerm = "";
  validationFilter: string | null = null;

  readonly tableController: LazyTableController<
    AdminAdOperationRow,
    AdminAdOperationsFilter & LazyTableFilterState
  >;

  notificationsDialogVisible = false;
  expiryNotifications: AdminExpiryNotification[] = [];
  notificationsLoading = false;
  selectedAdvertiserLabel = "";

  textDialogVisible = false;
  selectedTextDialogTitle = "";
  selectedTextDialogValue = "";

  readonly validationOptions: { label: string; value: string }[] = [
    { label: "Pending", value: "PENDING" },
    { label: "Approved", value: "APPROVED" },
    { label: "Rejected", value: "REJECTED" },
  ];

  private readonly stageLabels: Record<string, string> = {
    PENDING_VALIDATION: "Pending validation",
    REJECTED: "Rejected",
    IN_BOX: "In box",
    APPROVED_NO_ACTIVE_SUBSCRIPTION: "Approved (no active subscription)",
    SUBSCRIPTION_EXPIRED: "Subscription expired",
    ON_AIR_OPEN_ENDED: "On air (open-ended)",
    ON_AIR: "On air",
    SUBSCRIPTION_ENDED: "Ended",
    APPROVED_OTHER: "Other",
  };

  constructor(
    private readonly adminAdOperationsService: AdminAdOperationsService,
    private readonly toastService: ToastService
  ) {
    this.tableController = new LazyTableController<
      AdminAdOperationRow,
      AdminAdOperationsFilter & LazyTableFilterState
    >(
      { page: 1, size: 10, sortBy: "adName", sortDir: "asc" },
      (filters) =>
        this.adminAdOperationsService
          .findPage({
            page: filters.page || 1,
            size: filters.size || 10,
            sortBy: filters.sortBy,
            sortDir: filters.sortDir,
            genericFilter: filters.genericFilter,
            validation: this.validationFilter || undefined,
          })
          .pipe(
            map((result) => ({
              list: result.list ?? [],
              totalElements:
                result.totalRecords ?? result.totalElements ?? result.list?.length ?? 0,
            }))
          ),
      () => this.toastService.error("Could not load data.")
    );
  }

  get rows(): AdminAdOperationRow[] {
    return this.tableController.items;
  }

  get loading(): boolean {
    return this.tableController.loading;
  }

  get totalRecords(): number {
    return this.tableController.totalRecords;
  }

  get currentFilters(): AdminAdOperationsFilter & LazyTableFilterState {
    return this.tableController.currentFilters;
  }

  ngOnInit(): void {
    this.loadRows();
  }

  loadRows(): void {
        this.tableController.load(this.searchTerm);
  }

  onSearch(): void {
        this.tableController.onSearch(this.searchTerm);
  }

  onPageChange(event: TableLazyPageEvent): void {
        this.tableController.onPageChange(event, this.searchTerm);
  }

  getUrgencySeverity(
    level: AdminUrgencyLevel
  ): "success" | "warn" | "danger" | "secondary" {
    switch (level) {
      case "GREEN":
        return "success";
      case "YELLOW":
        return "warn";
      case "RED":
        return "danger";
      default:
        return "secondary";
    }
  }

  urgencyLabel(level: AdminUrgencyLevel): string {
    switch (level) {
      case "GREEN":
        return "> 14 days";
      case "YELLOW":
        return "4–14 days";
      case "RED":
        return "≤ 3 days or expired";
      default:
        return "—";
    }
  }

  stageLabel(stage: string): string {
    return this.stageLabels[stage] ?? stage;
  }

  openExpiryNotifications(row: AdminAdOperationRow): void {
    this.selectedAdvertiserLabel = row.advertiserBusinessName ?? row.advertiserId;
    this.notificationsDialogVisible = true;
    this.expiryNotifications = [];
    this.notificationsLoading = true;
    this.adminAdOperationsService.listExpiryNotifications(row.advertiserId).subscribe({
      next: (list) => {
        this.expiryNotifications = list;
        this.notificationsLoading = false;
      },
      error: () => {
        this.toastService.error("Could not load expiry reminders.");
        this.notificationsLoading = false;
      },
    });
  }

  closeNotificationsDialog(): void {
    this.notificationsDialogVisible = false;
    this.expiryNotifications = [];
  }

  openTextDialog(title: string, value: string | null | undefined): void {
    this.selectedTextDialogTitle = title;
    this.selectedTextDialogValue = value ?? "—";
    this.textDialogVisible = true;
  }

  closeTextDialog(): void {
    this.textDialogVisible = false;
    this.selectedTextDialogTitle = "";
    this.selectedTextDialogValue = "";
  }

  exportCsv(): void {
    this.adminAdOperationsService.downloadSubscriptionsCsv().subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "subscriptions-export.csv";
        a.click();
        URL.revokeObjectURL(url);
        this.toastService.success("Export started.");
      },
      error: () => {
        this.toastService.error("Failed to export CSV.");
      },
    });
  }
}
