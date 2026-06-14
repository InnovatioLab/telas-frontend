import {
  AfterViewInit,
  Component,
  ElementRef,
  NgZone,
  OnInit,
  ViewChild,
  inject,
} from "@angular/core";
import { CommonModule, DatePipe } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { TimelineModule } from "primeng/timeline";
import { DataViewModule } from "primeng/dataview";
import { TagModule } from "primeng/tag";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import {
  BoxOverview,
  MonitoringBoxOverviewService,
} from "@app/core/service/api/monitoring-box-overview.service";
import { ToastService } from "@app/core/service/state/toast.service";
import * as L from "leaflet";

@Component({
  selector: "app-box-overview-tab",
  standalone: true,
  imports: [CommonModule, FormsModule, PrimengModule, TimelineModule, DataViewModule, TagModule, ProgressSpinnerModule, DatePipe],
  templateUrl: "./box-overview-tab.component.html",
  styleUrls: ["./box-overview-tab.component.scss"],
})
export class BoxOverviewTabComponent implements OnInit, AfterViewInit {
  private readonly boxOverviewService = inject(MonitoringBoxOverviewService);
  private readonly toastService = inject(ToastService);
  private readonly ngZone = inject(NgZone);

  @ViewChild("mapContainer") mapContainerRef?: ElementRef<HTMLDivElement>;

  boxes: BoxOverview[] = [];
  loading = false;
  viewMode: "cards" | "map" = "cards";
  selectedBox: BoxOverview | null = null;
  drawerVisible = false;

  private leafletMap: L.Map | null = null;
  private mapInitialized = false;

  ngOnInit(): void {
    this.loadBoxes();
  }

  ngAfterViewInit(): void {
    if (this.viewMode === "map" && !this.mapInitialized) {
      this.initMap();
    }
  }

  loadBoxes(): void {
    this.loading = true;
    this.boxOverviewService.listBoxOverview().subscribe({
      next: (data) => {
        this.boxes = data ?? [];
        this.loading = false;
        if (this.viewMode === "map" && !this.mapInitialized) {
          setTimeout(() => this.initMap(), 50);
        }
      },
      error: (err) => {
        this.loading = false;
        if (err?.status === 403) {
          this.toastService.error("No permission to view box overview.");
        } else {
          this.toastService.error("Failed to load box overview.");
        }
      },
    });
  }

  switchView(mode: "cards" | "map"): void {
    this.viewMode = mode;
    if (mode === "map" && !this.mapInitialized && this.boxes.length > 0) {
      setTimeout(() => this.initMap(), 50);
    }
  }

  openDrawer(box: BoxOverview): void {
    this.selectedBox = box;
    this.drawerVisible = true;
  }

  statusSeverity(box: BoxOverview): "success" | "danger" | "secondary" {
    if (!box.active) return "secondary";
    return box.reachable ? "success" : "danger";
  }

  statusLabel(box: BoxOverview): string {
    if (!box.active) return "Inactive";
    return box.reachable ? "Online" : "Offline";
  }

  lastSeenLabel(lastSeenAt: string | null): string {
    if (!lastSeenAt) return "Never";
    const diff = Date.now() - new Date(lastSeenAt).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "< 1 min ago";
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  private initMap(): void {
    if (this.mapInitialized || !this.mapContainerRef) return;

    const el = this.mapContainerRef.nativeElement;
    if (!el || el.offsetParent === null) return;

    const firstWithCoords = this.boxes
      .flatMap((b) => b.monitors)
      .find((m) => m.latitude != null && m.longitude != null);

    const center: L.LatLngExpression = firstWithCoords
      ? [firstWithCoords.latitude!, firstWithCoords.longitude!]
      : [0, 0];

    this.leafletMap = L.map(el).setView(center, firstWithCoords ? 12 : 2);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(this.leafletMap);

    this.boxes.forEach((box) => {
      box.monitors.forEach((monitor) => {
        if (monitor.latitude == null || monitor.longitude == null) return;
        const color = box.reachable ? "#22c55e" : "#ef4444";
        const circle = L.circleMarker([monitor.latitude, monitor.longitude], {
          radius: 10,
          fillColor: color,
          color: "#fff",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.85,
        });
        circle.bindPopup(
          `<strong>${box.ip ?? "—"}</strong><br/>${monitor.partnerName ?? "—"}<br/>${monitor.street ?? ""} ${monitor.city ?? ""}`
        );
        circle.on("click", () => this.ngZone.run(() => this.openDrawer(box)));
        circle.addTo(this.leafletMap!);
      });
    });

    this.mapInitialized = true;
  }
}
