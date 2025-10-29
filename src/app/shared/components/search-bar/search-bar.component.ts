import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { SearchMonitorsService } from "@app/core/service/api/search-monitors.service";
import { LoadingService } from "@app/core/service/state/loading.service";
import { MapPoint } from "@app/core/service/state/map-point.interface";
import { ToastService } from "@app/core/service/state/toast.service";
import { IconsModule } from "@app/shared/icons/icons.module";
import { PrimengModule } from "@app/shared/primeng/primeng.module";

@Component({
  selector: "app-search-bar",
  standalone: true,
  imports: [CommonModule, FormsModule, PrimengModule, IconsModule],
  templateUrl: "./search-bar.component.html",
  styleUrls: ["./search-bar.component.scss"],
})
export class SearchBarComponent {
  @Output() monitorsFound = new EventEmitter<MapPoint[]>();
  searchText: string = "";

  constructor(
    private readonly searchMonitorsService: SearchMonitorsService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService
  ) {}

  get isSearching(): boolean {
    return this.loadingService.loadingSub.getValue();
  }

  searchAddress(): void {
    const searchTextCopy = this.searchText.trim();
    if (!searchTextCopy) return;

    const zipRegex = /^\d{5}$/;
    this.loadingService.setLoading(true, "address-search");

    if (zipRegex.test(searchTextCopy)) {
      this.searchMonitorsService.findNearestMonitors(searchTextCopy).subscribe({
        next: (monitors) => {
          this.loadingService.setLoading(false, "address-search");

          if (monitors && monitors.length > 0) {
            const mapPoints = this.convertMonitorsToMapPoints(monitors);
            this.monitorsFound.emit(mapPoints);
            this.toastService.sucesso(
              `Found ${monitors.length} monitors near ZIP code ${searchTextCopy}`
            );
            this.searchText = "";
          }
        },
        error: (error) => {
          this.loadingService.setLoading(false, "address-search");
          console.error("Error searching monitors:", error);
          this.toastService.erro(
            `Error searching monitors with ZIP code ${searchTextCopy}`
          );
        },
      });
    } else {
      this.loadingService.setLoading(false, "address-search");
      this.toastService.erro("Please enter a valid 5-digit ZIP code");
    }
  }

  onKeyPress(event: KeyboardEvent): void {
    const allowedKeys = /[0-9]/;
    const key = event.key;

    if (
      event.ctrlKey ||
      event.metaKey ||
      key === "Backspace" ||
      key === "Delete" ||
      key === "Tab" ||
      key === "Enter" ||
      key === "ArrowLeft" ||
      key === "ArrowRight" ||
      key === "Home" ||
      key === "End"
    ) {
      return;
    }

    if (!allowedKeys.test(key)) {
      event.preventDefault();
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const clipboardData = event.clipboardData?.getData("text") || "";
    const filteredText = clipboardData.replace(/[^0-9]/g, "");
    if (filteredText) {
      this.searchText = (this.searchText || "") + filteredText;
    }
  }

  onInputChange(): void {
    if (this.searchText) {
      const filteredText = this.searchText.replace(/[^0-9]/g, "");
      if (filteredText !== this.searchText) {
        this.searchText = filteredText;
      }
    }
  }

  private convertMonitorsToMapPoints(monitors: any[]): MapPoint[] {
    return monitors.map((monitor) => ({
      id: monitor.id,
      title: `Monitor ${monitor.type} - ${monitor.size}"`,
      description: this.buildMonitorDescription(monitor),
      latitude: monitor.latitude,
      longitude: monitor.longitude,
      category: "MONITOR",
      addressLocationName: monitor.addressLocationName,
      addressLocationDescription: monitor.addressLocationDescription,
      locationDescription: monitor.monitorLocationDescription,
      hasAvailableSlots: monitor.hasAvailableSlots,
      photoUrl: monitor.photoUrl,
      data: monitor,
    }));
  }

  private buildMonitorDescription(monitor: any): string {
    const parts: string[] = [];
    if (monitor.hasAvailableSlots !== undefined) {
      parts.push(
        `Available Slots: ${monitor.hasAvailableSlots ? "Yes" : "No"}`
      );
    }
    if (monitor.adsDailyDisplayTimeInMinutes) {
      parts.push(
        `Daily Display Time: ${monitor.adsDailyDisplayTimeInMinutes} min`
      );
    }
    if (monitor.estimatedSlotReleaseDate && !monitor.hasAvailableSlots) {
      const releaseDate = new Date(monitor.estimatedSlotReleaseDate);
      parts.push(`Next Available: ${releaseDate.toLocaleDateString()}`);
    }
    return parts.join(" | ") || "Monitor Information";
  }
}
