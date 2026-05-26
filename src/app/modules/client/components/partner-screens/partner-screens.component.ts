import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { ClientService } from "@app/core/service/api/client.service";
import { MonitorService } from "@app/core/service/api/monitor.service";
import { ToastService } from "@app/core/service/state/toast.service";
import { ConfirmationDialogService } from "@app/shared/services/confirmation-dialog.service";
import { MonitorAdResponseDto } from "@app/model/dto/response/monitor-response.dto";
import { Monitor } from "@app/model/monitors";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { TagModule } from "primeng/tag";

@Component({
  selector: "app-partner-screens",
  standalone: true,
  imports: [CommonModule, PrimengModule, TagModule],
  templateUrl: "./partner-screens.component.html",
  styleUrls: ["./partner-screens.component.scss"],
})
export class PartnerScreensComponent implements OnInit {
  screens: Monitor[] = [];
  loading = false;
  requestingRemovalAdId: string | null = null;

  constructor(
    private readonly monitorService: MonitorService,
    private readonly clientService: ClientService,
    private readonly toastService: ToastService,
    private readonly confirmationDialogService: ConfirmationDialogService
  ) {}

  ngOnInit(): void {
    this.loadScreens();
  }

  loadScreens(): void {
    this.loading = true;
    this.monitorService.getPartnerScreens().subscribe({
      next: (screens) => {
        this.screens = screens;
        this.loading = false;
      },
      error: () => {
        this.toastService.erro("Failed to load your screens");
        this.loading = false;
      },
    });
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
