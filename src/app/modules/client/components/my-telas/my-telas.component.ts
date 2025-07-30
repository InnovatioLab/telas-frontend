import { CommonModule, formatDate } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { AdService } from "@app/core/service/api/ad.service";
import { ToastService } from "@app/core/service/state/toast.service";
import { AdValidationType } from "@app/model/client";
import { AdResponseDto } from "@app/model/dto/response/ad-response.dto";
import { TableComponent } from "@app/shared/components/table/table.component";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { IColumn } from "@app/shared/utils/table.utils";

@Component({
  selector: "app-my-telas",
  templateUrl: "./my-telas.component.html",
  styleUrls: ["./my-telas.component.scss"],
  standalone: true,
  imports: [CommonModule, PrimengModule, TableComponent],
})
export class MyTelasComponent implements OnInit {
  loading = false;
  ads: AdResponseDto[] = [];

  pageSize = 10;
  totalRecords = 0;
  first = 0;
  pageNumber = 0;

  activeTabIndex: number = 0;
  tabs = [
    { label: "All Ads", key: "all" },
    { label: "Pending", key: "pending" },
    { label: "Approved", key: "approved" },
    { label: "Rejected", key: "rejected" },
  ];

  tableColumns: IColumn[] = [
    { header: "Submission Date", body: "submissionDate", sortable: true },
    { header: "Link", body: "link", sortable: false },
    { header: "Status", body: "validation", sortable: true },
    { header: "Waiting Days", body: "waitingDays", sortable: true },
    { header: "Actions", body: "actions", typeContent: "action" },
  ];

  constructor(
    private readonly adService: AdService,
    private readonly toastService: ToastService
  ) {}

  ngOnInit(): void {}

  onTabChange(event: any): void {
    this.activeTabIndex = event.index;
    this.resetPagination();
  }

  formatAdsForDisplay(ads: AdResponseDto[]): any[] {
    return ads.map((ad) => ({
      ...ad,
      submissionDate: formatDate(ad.submissionDate, "MMM d, yyyy", "en-US"),
      validation: this.formatValidationStatus(ad.validation),
    }));
  }

  formatValidationStatus(status: AdValidationType): string {
    switch (status) {
      case AdValidationType.PENDING:
        return "Pending";
      case AdValidationType.APPROVED:
        return "Approved";
      case AdValidationType.REJECTED:
        return "Rejected";
      default:
        return "Unknown";
    }
  }

  onPageChange(event: any): void {
    this.first = event.first;
    this.pageSize = event.rows;
    this.pageNumber = event.page;
  }

  resetPagination(): void {
    this.first = 0;
    this.pageNumber = 0;
  }

  viewAd(id: string): void {}

  editAd(id: string): void {}

  getStatusClass(status: string): string {
    switch (status) {
      case "Pending":
        return "status-pending";
      case "Approved":
        return "status-approved";
      case "Rejected":
        return "status-rejected";
      default:
        return "";
    }
  }
}
