import { CommonModule } from "@angular/common";
import { Component, EventEmitter, inject, Output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MonitorMapsResponseDto, SearchMonitorsService } from "@app/core/service/api/search-monitors.service";
import { MonitorMapPointMapper } from "@app/core/service/mapper/monitor-map-point.mapper";
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

  private readonly searchMonitorsService = inject(SearchMonitorsService);
  private readonly loadingService = inject(LoadingService);
  private readonly toastService = inject(ToastService);
  private readonly monitorMapPointMapper = inject(MonitorMapPointMapper);

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
        next: (monitors: MonitorMapsResponseDto[]) => {
          this.loadingService.setLoading(false, "address-search");

          if (monitors && monitors.length > 0) {
            const mapPoints = this.monitorMapPointMapper.convertToMapPoints(monitors);
            this.monitorsFound.emit(mapPoints);
            this.toastService.success(
              `Found ${monitors.length} monitors near ZIP code ${searchTextCopy}`
            );
            this.searchText = "";
          }
        },
        error: (error) => {
          this.loadingService.setLoading(false, "address-search");
          this.toastService.error(
            `Error searching monitors with ZIP code ${searchTextCopy}`
          );
        },
      });
    } else {
      this.loadingService.setLoading(false, "address-search");
      this.toastService.error("Please enter a valid 5-digit ZIP code");
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
}
