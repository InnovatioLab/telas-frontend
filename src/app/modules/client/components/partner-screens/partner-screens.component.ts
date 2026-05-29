import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { PARTNER_PORTAL_ROUTES } from "@app/core/constants/partner-api.paths";
import { ClientService } from "@app/core/service/api/client.service";
import { PartnerPortalService } from "@app/core/service/api/partner-portal.service";
import { ToastService } from "@app/core/service/state/toast.service";
import {
  AdRequestResponseDto,
  PartnerSubmissionMode,
} from "@app/model/dto/response/ad-request-response.dto";
import { MonitorAdResponseDto } from "@app/model/dto/response/monitor-response.dto";
import { Monitor } from "@app/model/monitors";
import { ConfirmationDialogService } from "@app/shared/services/confirmation-dialog.service";
import {
  adRequestWorkflowLabel,
  adRequestWorkflowSeverity,
  partnerSubmissionModeLabel,
} from "@app/shared/utils/ad-request-display.util";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { TagModule } from "primeng/tag";
import { TableLazyLoadEvent } from "primeng/table";

type PartnerScreensTab = "screens" | "requests";

@Component({
  selector: "app-partner-screens",
  standalone: true,
  imports: [CommonModule, FormsModule, PrimengModule, TagModule],
  templateUrl: "./partner-screens.component.html",
  styleUrls: ["./partner-screens.component.scss"],
})
export class PartnerScreensComponent implements OnInit {
  activeTab: PartnerScreensTab = "screens";

  screens: Monitor[] = [];
  screensLoading = false;
  requestingRemovalAdId: string | null = null;

  adRequests: AdRequestResponseDto[] = [];
  adRequestsLoading = false;
  adRequestsTotal = 0;
  adRequestsPage = 1;
  adRequestsPageSize = 10;
  adRequestsSearch = "";

  constructor(
    private readonly partnerPortalService: PartnerPortalService,
    private readonly clientService: ClientService,
    private readonly toastService: ToastService,
    private readonly confirmationDialogService: ConfirmationDialogService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    const tab = this.route.snapshot.queryParamMap.get("tab");
    if (tab === "requests") {
      this.activeTab = "requests";
    }
    this.loadScreens();
    if (this.activeTab === "requests") {
      this.loadAdRequests();
    }
  }

  onTabChange(index: number): void {
    this.activeTab = index === 1 ? "requests" : "screens";
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: this.activeTab === "requests" ? "requests" : null },
      queryParamsHandling: "merge",
      replaceUrl: true,
    });
    if (this.activeTab === "requests" && this.adRequests.length === 0 && !this.adRequestsLoading) {
      this.loadAdRequests();
    }
  }

  loadScreens(): void {
    this.screensLoading = true;
    this.partnerPortalService.getMyScreens().subscribe({
      next: (screens) => {
        this.screens = screens;
        this.screensLoading = false;
      },
      error: () => {
        this.toastService.erro("Failed to load your screens");
        this.screensLoading = false;
      },
    });
  }

  loadAdRequests(): void {
    this.adRequestsLoading = true;
    this.partnerPortalService
      .getMyAdRequests({
        page: this.adRequestsPage,
        size: this.adRequestsPageSize,
        sortBy: "createdAt",
        sortDir: "desc",
        genericFilter: this.adRequestsSearch.trim() || undefined,
      })
      .subscribe({
        next: (response) => {
          this.adRequests = response.list ?? [];
          this.adRequestsTotal = response.totalElements ?? 0;
          this.adRequestsLoading = false;
        },
        error: () => {
          this.toastService.erro("Failed to load your ad requests");
          this.adRequestsLoading = false;
        },
      });
  }

  onAdRequestsSearch(): void {
    this.adRequestsPage = 1;
    this.loadAdRequests();
  }

  onAdRequestsPage(event: TableLazyLoadEvent): void {
    const first = event.first ?? 0;
    const rows = event.rows ?? this.adRequestsPageSize;
    this.adRequestsPage = Math.floor(first / rows) + 1;
    this.adRequestsPageSize = rows;
    this.loadAdRequests();
  }

  screenAddress(screen: Monitor): string {
    if (screen.fullAddress?.trim()) {
      return screen.fullAddress;
    }
    const addr = screen.address;
    if (!addr) {
      return "—";
    }
    return [addr.street, addr.city, addr.state, addr.zipCode]
      .filter((part) => !!part?.trim())
      .join(", ");
  }

  screenAds(screen: Monitor): MonitorAdResponseDto[] {
    return screen.adLinks ?? [];
  }

  adsLabel(screen: Monitor): string {
    const count = screen.activeAdsCount ?? this.screenAds(screen).length;
    const max = screen.maxAds ?? 10;
    return `${count} / ${max}`;
  }

  deploymentLabel(ad: MonitorAdResponseDto): string {
    switch (ad.deploymentStatus) {
      case "ON_AIR":
        return "On air";
      case "STAGED":
        return "Staged on box";
      case "APPROVED_PENDING":
        return "Approved";
      default:
        return ad.deploymentStatus ?? "—";
    }
  }

  deploymentSeverity(
    ad: MonitorAdResponseDto
  ): "success" | "info" | "warning" | "danger" | "secondary" {
    switch (ad.deploymentStatus) {
      case "ON_AIR":
        return "success";
      case "STAGED":
        return "info";
      case "APPROVED_PENDING":
        return "warning";
      default:
        return "secondary";
    }
  }

  modeLabel(mode?: PartnerSubmissionMode | null): string {
    return partnerSubmissionModeLabel(mode);
  }

  workflowLabel(adRequest: AdRequestResponseDto): string {
    return adRequest.adminActionLabel?.trim() || adRequestWorkflowLabel(adRequest.workflowStatus);
  }

  workflowSeverity(adRequest: AdRequestResponseDto): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" {
    return adRequestWorkflowSeverity(adRequest.workflowStatus);
  }

  isRequestingRemoval(ad: MonitorAdResponseDto): boolean {
    return this.requestingRemovalAdId === ad.id;
  }

  isRemovalRequested(ad: MonitorAdResponseDto): boolean {
    return ad.partnerRemovalRequested === true;
  }

  async requestRemoval(ad: MonitorAdResponseDto): Promise<void> {
    const adId = ad.id?.trim();
    if (!adId || !ad.canRequestRemoval || this.isRemovalRequested(ad)) {
      return;
    }
    const adName = ad.fileName?.trim() || "this ad";
    const confirmed = await this.confirmationDialogService.confirm({
      title: "Delete ad",
      message: `Delete "<strong>${adName}</strong>"? If this ad is currently on a screen, our admin team will remove it from the playlist.`,
      confirmLabel: "Delete",
    });
    if (!confirmed) {
      return;
    }
    this.requestingRemovalAdId = adId;
    this.clientService.requestPartnerAdRemoval(adId).subscribe({
      next: () => {
        this.markRemovalRequested(adId);
        this.toastService.sucesso(
          "Removal request submitted. Our team will process it shortly."
        );
        this.requestingRemovalAdId = null;
      },
      error: (err: { error?: { mensagem?: string; message?: string } }) => {
        const msg =
          err?.error?.mensagem ??
          err?.error?.message ??
          "Failed to submit removal request";
        if (msg.toLowerCase().includes("already submitted")) {
          this.markRemovalRequested(adId);
        }
        this.toastService.erro(msg);
        this.requestingRemovalAdId = null;
      },
    });
  }

  openMapUpload(monitorId: string | null | undefined): void {
    if (!monitorId?.trim()) {
      return;
    }
    void this.router.navigate([PARTNER_PORTAL_ROUTES.mapUpload(monitorId)]);
  }

  private markRemovalRequested(adId: string): void {
    for (const screen of this.screens) {
      for (const link of screen.adLinks ?? []) {
        if (link.id === adId) {
          link.partnerRemovalRequested = true;
          link.canRequestRemoval = false;
        }
      }
    }
  }
}
