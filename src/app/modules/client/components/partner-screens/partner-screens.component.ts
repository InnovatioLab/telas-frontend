import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { MonitorService } from "@app/core/service/api/monitor.service";
import { ToastService } from "@app/core/service/state/toast.service";
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

  constructor(
    private readonly monitorService: MonitorService,
    private readonly router: Router,
    private readonly toastService: ToastService
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

  adsLabel(screen: Monitor): string {
    const count = screen.activeAdsCount ?? 0;
    const max = screen.maxAds ?? 10;
    return `${count} / ${max}`;
  }

  canUpload(screen: Monitor): boolean {
    const remaining = screen.remainingPartnerSlots ?? screen.remainingTotalSlots ?? 0;
    return screen.active !== false && remaining > 0;
  }

  openUpload(screen: Monitor): void {
    if (!screen.id) {
      return;
    }
    void this.router.navigate(["/client/screens", screen.id, "upload"]);
  }
}
