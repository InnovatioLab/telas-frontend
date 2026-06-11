import { CommonModule } from "@angular/common";
import {
  AfterViewChecked,
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  inject,
} from "@angular/core";
import { Router } from "@angular/router";
import {
  NotificationFilters,
  NotificationsService,
} from "@app/core/service/api/notifications.service";
import { Notification } from "@app/modules/notification/models/notification";
import { IconsModule } from "@app/shared/icons/icons.module";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { NotificationFilterBarComponent } from "./notification-filter-bar/notification-filter-bar.component";

@Component({
  selector: "app-notification-sidebar",
  standalone: true,
  imports: [CommonModule, PrimengModule, IconsModule, NotificationFilterBarComponent],
  templateUrl: "./notification-sidebar.component.html",
  styleUrls: ["./notification-sidebar.component.scss"],
})
export class NotificationSidebarComponent
  implements AfterViewInit, AfterViewChecked, OnChanges, OnDestroy
{
  @Input() visible: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  public readonly notificationsService = inject(NotificationsService);
  private readonly router = inject(Router);

  private linkListenerAdded = false;
  private currentFilters: NotificationFilters = {};
  private scrollContainer?: HTMLElement;
  private boundScrollHandler?: () => void;

  constructor(private elRef: ElementRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["visible"]?.currentValue === true) {
      this.notificationsService.resetAndFetch(this.currentFilters);
      setTimeout(() => this.attachScrollListener(), 80);
    } else if (changes["visible"]?.currentValue === false) {
      this.detachScrollListener();
    }
  }

  ngAfterViewInit() {
    this.addLinkStopPropagationListener();
  }

  ngAfterViewChecked() {
    this.addLinkStopPropagationListener();
  }

  ngOnDestroy(): void {
    this.detachScrollListener();
  }

  private attachScrollListener(): void {
    this.detachScrollListener();
    this.scrollContainer = document.querySelector(
      ".notification-sidebar .p-drawer-content"
    ) as HTMLElement;
    if (!this.scrollContainer) return;

    this.boundScrollHandler = () => {
      const { scrollTop, scrollHeight, clientHeight } = this.scrollContainer!;
      if (scrollHeight - scrollTop - clientHeight < 120) {
        this.notificationsService.loadNextPage(this.currentFilters);
      }
    };
    this.scrollContainer.addEventListener("scroll", this.boundScrollHandler, {
      passive: true,
    });
  }

  private detachScrollListener(): void {
    if (this.scrollContainer && this.boundScrollHandler) {
      this.scrollContainer.removeEventListener("scroll", this.boundScrollHandler);
    }
    this.scrollContainer = undefined;
    this.boundScrollHandler = undefined;
  }

  private addLinkStopPropagationListener() {
    if (this.linkListenerAdded) return;
    const handler = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const sidebarRoot = target.closest(".notification-sidebar");
      if (!sidebarRoot) {
        return;
      }

      const anchor = target.closest("a.link-text");
      if (!(anchor instanceof HTMLAnchorElement)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const href = anchor.getAttribute("href")?.trim() ?? "";
      if (!href) {
        return;
      }

      if (/^https?:\/\//i.test(href)) {
        window.location.href = href;
        return;
      }

      const path = href.startsWith("/") ? href : `/${href}`;
      this.router.navigateByUrl(path);
    };

    document.addEventListener("click", handler, true);
    this.linkListenerAdded = true;
  }

  onFiltersChange(filters: NotificationFilters): void {
    this.currentFilters = filters;
    this.notificationsService.resetAndFetch(filters);
  }

  closeSidebar(): void {
    this.visibleChange.emit(false);
  }

  markAsRead(notification: Notification): void {
    this.notificationsService.markAsRead(notification.id);
  }

  markAllAsRead(): void {
    this.notificationsService.markAllAsRead();
  }

  refresh(): void {
    this.notificationsService.resetAndFetch(this.currentFilters);
  }

  monitoringAccentClasses(notification: Notification): Record<string, boolean> {
    const accent = this.monitoringAccent(notification);
    return {
      "notification-item--accent-down": accent === "down",
      "notification-item--accent-up": accent === "up",
      "notification-item--accent-warn": accent === "warn",
    };
  }

  private monitoringAccent(
    notification: Notification
  ): "down" | "up" | "warn" | null {
    const ref = notification.reference;
    const msg = (notification.message || "").toLowerCase();
    if (ref === "BOX_STATUS_UPDATED" || ref === "MONITOR_STATUS_UPDATED") {
      if (msg.includes("reactivated")) {
        return "up";
      }
      if (msg.includes("deactivated")) {
        return "down";
      }
      return null;
    }
    if (ref === "SMART_PLUG_INCIDENT") {
      return "down";
    }
    if (ref === "SIDE_API_DOWN") {
      return "down";
    }
    if (ref === "SIDE_API_UP") {
      return "up";
    }
    if (ref === "MONITORING_HOST_REBOOT") {
      return "warn";
    }
    return null;
  }
}
