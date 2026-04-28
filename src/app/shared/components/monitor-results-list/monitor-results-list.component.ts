import { CommonModule } from "@angular/common";
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from "@angular/core";
import { ClientService } from "@app/core/service/api/client.service";
import { MonitorCartActionsService } from "@app/core/service/domain/monitor-cart-actions.service";
import { MapPoint } from "@app/core/service/state/map-point.interface";
import { buildMonitorAddressLabel } from "@app/core/service/utils/monitor-address-label.util";
import { ToastService } from "@app/core/service/state/toast.service";
import {
  buildStaticMapThumbnailUrl,
  buildStreetViewThumbnailUrl,
} from "@app/shared/utils/google-maps-thumb-url.util";
import { resolvePhotoUrl } from "@app/shared/utils/photo-url.utils";
import { IconCloseComponent } from "@app/shared/icons/close.icon";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { ENVIRONMENT } from "src/environments/environment-token";

export type MonitorResultListItem = MapPoint & {
  id: string;
  latitude: number;
  longitude: number;
};

@Component({
  selector: "app-monitor-results-list",
  standalone: true,
  imports: [CommonModule, PrimengModule, IconCloseComponent],
  templateUrl: "./monitor-results-list.component.html",
  styleUrls: ["./monitor-results-list.component.scss"],
})
export class MonitorResultsListComponent implements OnChanges {
  @Input({ required: true }) items: MonitorResultListItem[] = [];
  @Input({ required: true }) apiUrl: string;
  @Input() showShoppingActions = false;
  @Input() selectedId: string | null = null;
  @Input() showCloseButton = false;

  @Output() selected = new EventEmitter<MonitorResultListItem>();
  @Output() hoverMonitorIdChange = new EventEmitter<string | null>();
  @Output() closed = new EventEmitter<void>();

  private readonly brokenImages = new Set<string>();
  private readonly thumbAttempt = new Map<string, number>();
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly monitorCartActions = inject(MonitorCartActionsService);
  private readonly clientService = inject(ClientService);
  private readonly toastService = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly env = inject(ENVIRONMENT);


  ngOnChanges(changes: SimpleChanges): void {
    if (changes["items"]) {
      const ids = new Set(this.items.map((i) => i.id));
      for (const id of [...this.thumbAttempt.keys()]) {
        if (!ids.has(id)) {
          this.thumbAttempt.delete(id);
          this.brokenImages.delete(id);
        }
      }
    }
    if (changes["selectedId"]?.currentValue) {
      const id = changes["selectedId"].currentValue as string;
      queueMicrotask(() => this.scrollCardIntoView(id));
    }
  }

  trackById(_: number, item: MonitorResultListItem): string {
    return item.id;
  }

  onSelect(item: MonitorResultListItem): void {
    this.selected.emit(item);
  }

  onHoverEnter(item: MonitorResultListItem): void {
    this.hoverMonitorIdChange.emit(item.id);
  }

  onHoverLeave(): void {
    this.hoverMonitorIdChange.emit(null);
  }

  onCloseClick(event: Event): void {
    event.stopPropagation();
    this.closed.emit();
  }

  onNotify(item: MonitorResultListItem, event: Event): void {
    event.stopPropagation();
    this.clientService.addToWishlist(item.id).subscribe({
      next: () => {
        this.toastService.sucesso("Screen added to wishlist");
      },
      error: () => {
        this.toastService.erro("Error adding to wishlist");
      },
    });
  }

  onAddToCart(item: MonitorResultListItem, event: Event): void {
    event.stopPropagation();
    this.monitorCartActions.addMonitorToCart(item);
  }

  displayTitle(item: MonitorResultListItem): string {
    const name = item.addressLocationName?.trim();
    if (name) {
      return name;
    }
    const label = buildMonitorAddressLabel(item);
    if (label !== "Endereço indisponível") {
      return label;
    }
    return item.id ? `Location ${item.id.slice(0, 8)}…` : "Location";
  }

  displayAddress(item: MonitorResultListItem): string {
    const line =
      item.addressLocationDescription?.trim() ||
      item.locationDescription?.trim() ||
      "";
    return line || "—";
  }

  resolveThumbSrc(item: MonitorResultListItem): string | null {
    const n = this.thumbAttempt.get(item.id) ?? 0;
    const key = this.env.googleMapsApiKey?.trim();
    const lat = item.latitude;
    const lng = item.longitude;
    const coordsOk =
      lat != null &&
      lng != null &&
      !Number.isNaN(Number(lat)) &&
      !Number.isNaN(Number(lng));

    const monitorPhoto = resolvePhotoUrl({
      apiUrl: this.apiUrl,
      photoUrl: item.photoUrl,
    });

    if (n === 0 && monitorPhoto && !this.brokenImages.has(item.id)) {
      return monitorPhoto;
    }

    if (!key || !coordsOk) {
      return null;
    }

    if (n <= 1) {
      return buildStreetViewThumbnailUrl(lat, lng, key);
    }
    if (n === 2) {
      return buildStaticMapThumbnailUrl(lat, lng, key);
    }
    return null;
  }

  onThumbError(item: MonitorResultListItem): void {
    const n = this.thumbAttempt.get(item.id) ?? 0;
    const monitorPhoto = resolvePhotoUrl({
      apiUrl: this.apiUrl,
      photoUrl: item.photoUrl,
    });
    if (n === 0 && monitorPhoto) {
      this.brokenImages.add(item.id);
    }
    this.thumbAttempt.set(item.id, n + 1);
    this.cdr.markForCheck();
  }

  private scrollCardIntoView(id: string): void {
    const root = this.host.nativeElement;
    const el = root.querySelector(`[data-monitor-id="${id}"]`);
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
}
