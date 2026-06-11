import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { NotificationFilters } from "@app/core/service/api/notifications.service";
import { IconFieldModule } from "primeng/iconfield";
import { InputIconModule } from "primeng/inputicon";
import { InputTextModule } from "primeng/inputtext";
import { MultiSelectModule } from "primeng/multiselect";

interface CategoryOption {
  label: string;
  value: string[];
}

@Component({
  selector: "app-notification-filter-bar",
  standalone: true,
  imports: [CommonModule, FormsModule, IconFieldModule, InputIconModule, InputTextModule, MultiSelectModule],
  templateUrl: "./notification-filter-bar.component.html",
  styleUrl: "./notification-filter-bar.component.scss",
})
export class NotificationFilterBarComponent {
  @Output() filtersChange = new EventEmitter<NotificationFilters>();

  searchText = "";
  selectedCategories: string[][] = [];

  readonly CATEGORY_OPTIONS: CategoryOption[] = [
    {
      label: "Ad",
      value: [
        "CLIENT_AD_REJECTED",
        "CLIENT_AD_REJECTION_CONFIRMED",
        "CLIENT_AD_APPROVED_CONFIRMATION",
        "CLIENT_AD_ON_AIR",
        "CLIENT_AD_DEPLOYED_TO_BOX",
        "AD_RECEIVED",
        "AD_RESUBMITTED_FOR_VALIDATION",
        "ADMIN_AD_RESUBMITTED_TO_CLIENT",
        "ADMIN_CLIENT_AD_APPROVED",
        "ADMIN_AD_ON_AIR",
        "ADMIN_CLIENT_AD_DEPLOYED_TO_BOX",
        "AD_ADDED_TO_PLAYLIST_PENDING_SYNC",
        "ADMIN_AD_ADDED_TO_PLAYLIST_PENDING_SYNC",
        "AD_NOT_SENT_TO_MONITOR",
        "AD_REQUEST_QUESTIONNAIRE_UPDATED",
      ],
    },
    {
      label: "Box",
      value: ["BOX_STATUS_UPDATED", "SIDE_API_DOWN", "SIDE_API_UP", "MONITORING_HOST_REBOOT"],
    },
    {
      label: "Monitor",
      value: ["MONITOR_STATUS_UPDATED", "MONITOR_IN_WISHLIST_NOW_AVAILABLE"],
    },
    {
      label: "Smart Plug",
      value: ["SMART_PLUG_INCIDENT"],
    },
    {
      label: "Subscription",
      value: [
        "FIRST_SUBSCRIPTION",
        "NEW_SUBSCRIPTION",
        "SUBSCRIPTION_RENEWAL",
        "SUBSCRIPTION_UPGRADE",
        "SUBSCRIPTION_ABOUT_TO_EXPIRY_REMINDER",
        "SUBSCRIPTION_ABOUT_TO_EXPIRY_PENULTIMATE_DAY",
      ],
    },
  ];

  private debounceTimer?: ReturnType<typeof setTimeout>;

  onSearchInput(): void {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.emit(), 300);
  }

  onCategoryChange(): void {
    this.emit();
  }

  private emit(): void {
    this.filtersChange.emit({
      search: this.searchText.trim(),
      references: this.selectedCategories.flat(),
    });
  }
}
