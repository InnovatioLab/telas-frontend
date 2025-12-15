import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { ActivatedRoute, Router } from "@angular/router";
import { MonitorService } from "@app/core/service/api/monitor.service";
import { ToastService } from "@app/core/service/state/toast.service";
import { Monitor } from "@app/model/monitors";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { isPdfFile } from "@app/shared/utils/file-type.utils";
import { PdfViewerModule } from "ng2-pdf-viewer";
import { ProgressSpinnerModule } from "primeng/progressspinner";

interface MonitorAdItem {
  id: string;
  fileName: string;
  link: string;
  isAttachedToMonitor: boolean;
  orderIndex: number;
  blockQuantity: number;
}

@Component({
  selector: "app-monitor-ads-management",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PrimengModule,
    PdfViewerModule,
    ProgressSpinnerModule,
  ],
  templateUrl: "./monitor-ads-management.component.html",
  styleUrls: ["./monitor-ads-management.component.scss"],
})
export class MonitorAdsManagementComponent implements OnInit, OnDestroy {
  monitorId = "";
  monitor: Monitor | null = null;

  loading = false;
  saving = false;

  validAds: MonitorAdItem[] = [];
  monitorAds: MonitorAdItem[] = [];

  selectedPreviewAd: MonitorAdItem | null = null;
  availableAdsSearchTerm = "";

  showPreviewFullscreen = false;
  previewImages: MonitorAdItem[] = [];
  currentPreviewIndex = 0;
  private previewTimer?: ReturnType<typeof setTimeout>;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly monitorService: MonitorService,
    private readonly toastService: ToastService,
    private readonly sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.monitorId = this.route.snapshot.paramMap.get("monitorId") || "";

    if (!this.monitorId) {
      this.toastService.erro("Monitor not found");
      this.router.navigate(["/admin/screens"]);
      return;
    }

    this.loading = true;

    this.monitorService.getMonitorById(this.monitorId).subscribe({
      next: (monitor) => {
        if (!monitor) {
          this.toastService.erro("Monitor not found");
          this.router.navigate(["/admin/screens"]);
          return;
        }

        this.monitor = monitor;

        const currentMonitorAds: MonitorAdItem[] = (this.monitor?.adLinks || []).map((ad: any) => ({
          id: ad.id || "",
          fileName: ad.fileName || "Unknown file",
          link: ad.link || "",
          isAttachedToMonitor: true,
          orderIndex: ad.orderIndex || 0,
          blockQuantity: ad.blockQuantity || 1,
        }));

        const currentAdsIds = currentMonitorAds.map((ad) => ad.id);

        this.monitorService.getValidAds(this.monitorId).subscribe({
          next: (validAds) => {
            const validAdsItems: MonitorAdItem[] = [];

            (validAds || []).forEach((ad: any, idx: number) => {
              const isAttached = currentAdsIds.includes(ad.id);

              if (!isAttached) {
                const baseItem: MonitorAdItem = {
                  id: ad.id || "",
                  fileName: ad.fileName || "Unknown file",
                  link: ad.link || "",
                  isAttachedToMonitor: false,
                  orderIndex: ad.orderIndex || idx + 1,
                  blockQuantity: ad.blockQuantity || 1,
                };

                validAdsItems.push(baseItem);
              }
            });

            this.validAds = validAdsItems;

            this.monitorAds = currentMonitorAds
              .sort((a, b) => a.orderIndex - b.orderIndex)
              .map((ad, index) => ({
                ...ad,
                orderIndex: index + 1,
              }));

            this.selectedPreviewAd = this.monitorAds[0] || this.validAds[0] || null;
            this.loading = false;
          },
          error: () => {
            this.monitorAds = currentMonitorAds
              .sort((a, b) => a.orderIndex - b.orderIndex)
              .map((ad, index) => ({
                ...ad,
                orderIndex: index + 1,
              }));

            this.selectedPreviewAd = this.monitorAds[0] || null;
            this.toastService.erro("Error loading valid ads");
            this.loading = false;
          },
        });
      },
      error: () => {
        this.toastService.erro("Error loading monitor");
        this.router.navigate(["/admin/screens"]);
      },
    });
  }

  get totalBlockSlots(): number {
    return this.monitorAds.reduce(
      (sum, ad) => sum + (Number(ad.blockQuantity) || 0),
      0
    );
  }

  get hasBlockError(): boolean {
    return this.totalBlockSlots > 17;
  }

  get filteredValidAds(): MonitorAdItem[] {
    const term = this.availableAdsSearchTerm.trim().toLowerCase();
    if (!term) {
      return this.validAds;
    }
    return this.validAds.filter((ad) =>
      ad.fileName.toLowerCase().includes(term)
    );
  }

  selectPreview(ad: MonitorAdItem): void {
    this.selectedPreviewAd = ad;
  }

  moveToMonitor(ad: MonitorAdItem): void {
    const alreadyInMonitor = this.monitorAds.some((a) => a.id === ad.id);
    if (alreadyInMonitor) {
      return;
    }

    const newItem: MonitorAdItem = {
      ...ad,
      isAttachedToMonitor: true,
      orderIndex: this.monitorAds.length + 1,
      blockQuantity: ad.blockQuantity || 1,
    };

    this.monitorAds = [...this.monitorAds, newItem];
  }

  removeFromMonitor(ad: MonitorAdItem): void {
    this.monitorAds = this.monitorAds
      .filter((a) => a.id !== ad.id)
      .map((item, index) => ({
        ...item,
        orderIndex: index + 1,
      }));

    if (this.selectedPreviewAd?.id === ad.id) {
      this.selectedPreviewAd = this.monitorAds[0] || this.validAds[0] || null;
    }
  }

  moveUp(index: number): void {
    if (index <= 0 || index >= this.monitorAds.length) {
      return;
    }

    const newList = [...this.monitorAds];
    const temp = newList[index - 1];
    newList[index - 1] = newList[index];
    newList[index] = temp;

    this.monitorAds = newList.map((item, idx) => ({
      ...item,
      orderIndex: idx + 1,
    }));
  }

  moveDown(index: number): void {
    if (index < 0 || index >= this.monitorAds.length - 1) {
      return;
    }

    const newList = [...this.monitorAds];
    const temp = newList[index + 1];
    newList[index + 1] = newList[index];
    newList[index] = temp;

    this.monitorAds = newList.map((item, idx) => ({
      ...item,
      orderIndex: idx + 1,
    }));
  }

  changeBlockQuantity(ad: MonitorAdItem, value: number): void {
    this.monitorAds = this.monitorAds.map((item) =>
      item.id === ad.id
        ? { ...item, blockQuantity: Number(value) || 1 }
        : item
    );
  }

  isPdf(ad: MonitorAdItem | null): boolean {
    if (!ad) {
      return false;
    }

    const name = (ad.fileName || "").toLowerCase();
    const link = (ad.link || "").toLowerCase();

    if (isPdfFile(name)) {
      return true;
    }

    return link.endsWith(".pdf") || link.includes(".pdf?");
  }

  getPdfUrl(ad: MonitorAdItem): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(ad.link);
  }

  cancelar(): void {
    this.router.navigate(["/admin/screens"]);
  }

  salvar(): void {
    if (!this.monitor || this.saving) {
      return;
    }

    if (this.hasBlockError) {
      this.toastService.erro("Total block slots must be less or equal to 17");
      return;
    }

    const reservedCount = this.monitorAds.filter(
      (ad) => Number(ad.blockQuantity) === 7
    ).length;

    if (reservedCount > 1) {
      this.toastService.erro(
        "Only one ad with partner reserved slots (7) is allowed per monitor."
      );
      return;
    }

    this.saving = true;

    const ads = this.monitorAds.map((ad) => ({
      id: ad.id,
      orderIndex: ad.orderIndex,
      blockQuantity: ad.blockQuantity,
    }));

    const payload: any = {
      addressId: this.monitor.address.id,
      active: this.monitor.active,
      ads,
    };

    this.monitorService.updateMonitor(this.monitor.id, payload).subscribe({
      next: (success) => {
        if (success) {
          this.toastService.sucesso("Ads saved successfully");
          this.router.navigate(["/admin/screens"]);
        } else {
          this.toastService.erro("Failed to save ads");
        }
      },
      error: (error) => {
        if (
          error?.status === 422 &&
          error?.error?.errors &&
          Array.isArray(error.error.errors) &&
          error.error.errors.length > 0
        ) {
          this.toastService.erro(error.error.errors[0]);
        } else {
          this.toastService.erro("Failed to save ads");
        }
      },
      complete: () => {
        this.saving = false;
      },
    });
  }

  openPreview(): void {
    if (this.monitorAds.length === 0) {
      this.toastService.erro("Nenhum ad selecionado para preview");
      return;
    }

    this.previewImages = [...this.monitorAds]
      .sort((a, b) => a.orderIndex - b.orderIndex);

    this.currentPreviewIndex = 0;
    this.showPreviewFullscreen = true;

    setTimeout(() => {
      this.startPreviewTimer();
    }, 100);
  }

  closePreview(): void {
    this.showPreviewFullscreen = false;
    this.stopPreviewTimer();
  }

  onPreviewVisibleChange(visible: boolean): void {
    if (!visible) {
      this.closePreview();
    }
  }

  private startPreviewTimer(): void {
    this.stopPreviewTimer();

    if (this.previewImages.length === 0 || !this.showPreviewFullscreen) {
      return;
    }

    const currentAd = this.previewImages[this.currentPreviewIndex];
    const displayTime = (currentAd.blockQuantity || 1) * 5000; // 5s por blockQuantity
    const transitionTime = 2000; // 2s de transição

    const totalTime = displayTime + transitionTime;

    this.previewTimer = setTimeout(() => {
      this.currentPreviewIndex = (this.currentPreviewIndex + 1) % this.previewImages.length;
      
      this.startPreviewTimer();
    }, totalTime);
  }

  private stopPreviewTimer(): void {
    if (this.previewTimer) {
      clearTimeout(this.previewTimer);
      this.previewTimer = undefined;
    }
  }

  isPdfPreview(ad: MonitorAdItem): boolean {
    return this.isPdf(ad);
  }

  ngOnDestroy(): void {
    this.stopPreviewTimer();
  }
}


