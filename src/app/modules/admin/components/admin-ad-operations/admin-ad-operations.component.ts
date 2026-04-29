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
  rows: AdminAdOperationRow[] = [];
  loading = false;
  searchTerm = "";
  validationFilter: string | null = null;
  totalRecords = 0;
  currentFilters: AdminAdOperationsFilter = {
    page: 1,
    size: 10,
    sortBy: "adName",
    sortDir: "asc",
  };

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
  ) {}

  ngOnInit(): void {
    this.loadRows();
  }

  loadRows(): void {
    this.loading = true;
    const filters: AdminAdOperationsFilter = {
      page: this.currentFilters.page || 1,
      size: this.currentFilters.size || 10,
      sortBy: this.currentFilters.sortBy,
      sortDir: this.currentFilters.sortDir,
      genericFilter: this.searchTerm.trim() || undefined,
      validation: this.validationFilter || undefined,
    };
    this.adminAdOperationsService.findPage(filters).subscribe({
      next: (result) => {
        this.rows = result.list ?? [];
        this.totalRecords =
          result.totalRecords ?? result.totalElements ?? this.rows.length;
        this.loading = false;
      },
      error: () => {
        this.toastService.erro("Could not load data.");
        this.loading = false;
      },
    });
  }

  onSearch(): void {
    this.currentFilters.page = 1;
    this.loadRows();
  }

  onPageChange(event: {
    first?: number;
    rows?: number;
    page?: number;
  }): void {
    const rows = event.rows ?? 10;
    if (event.page != null) {
      this.currentFilters.page = event.page + 1;
    } else {
      const first = event.first ?? 0;
      this.currentFilters.page = Math.floor(first / rows) + 1;
    }
    this.currentFilters.size = rows;
    this.loadRows();
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
        this.toastService.erro("Could not load expiry reminders.");
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
        this.toastService.sucesso("Export started.");
      },
      error: () => {
        this.toastService.erro("Failed to export CSV.");
      },
    });
  }
}
