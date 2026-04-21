import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { MapPoint } from "@app/core/service/state/map-point.interface";
import { resolvePhotoUrl } from "@app/shared/utils/photo-url.utils";
import { ENVIRONMENT } from "src/environments/environment-token";
import { Environment } from "src/environments/environment.interface";

export type MonitorResultListItem = MapPoint & {
  id: string;
  latitude: number;
  longitude: number;
};

@Component({
  selector: "app-monitor-results-list",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./monitor-results-list.component.html",
  styleUrls: ["./monitor-results-list.component.scss"],
})
export class MonitorResultsListComponent {
  @Input({ required: true }) items: MonitorResultListItem[] = [];
  @Input({ required: true }) apiUrl: string;

  @Output() selected = new EventEmitter<MonitorResultListItem>();

  private readonly brokenImages = new Set<string>();

  trackById(_: number, item: MonitorResultListItem): string {
    return item.id;
  }

  onSelect(item: MonitorResultListItem): void {
    this.selected.emit(item);
  }

  resolveItemPhotoUrl(item: MonitorResultListItem): string | null {
    if (this.brokenImages.has(item.id)) return null;
    return resolvePhotoUrl({ apiUrl: this.apiUrl, photoUrl: item.photoUrl });
  }

  onImgError(item: MonitorResultListItem): void {
    this.brokenImages.add(item.id);
  }
}

