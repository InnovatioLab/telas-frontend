import { CommonModule } from "@angular/common";
import {
  AfterViewChecked,
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  Output,
} from "@angular/core";
import { Router } from "@angular/router";
import { NotificationsService } from "@app/core/service/api/notifications.service";
import { IconsModule } from "@app/shared/icons/icons.module";
import { PrimengModule } from "@app/shared/primeng/primeng.module";

import { Notification } from "@app/modules/notificacao/models/notification";

@Component({
  selector: "app-notification-sidebar",
  standalone: true,
  imports: [CommonModule, PrimengModule, IconsModule],
  templateUrl: "./notification-sidebar.component.html",
  styleUrls: ["./notification-sidebar.component.scss"],
})
export class NotificationSidebarComponent
  implements AfterViewInit, AfterViewChecked
{
  @Input() visible: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  public readonly notificationsService = inject(NotificationsService);
  private readonly router = inject(Router);

  private linkListenerAdded = false;

  constructor(private elRef: ElementRef) {}

  ngAfterViewInit() {
    this.addLinkStopPropagationListener();
  }

  ngAfterViewChecked() {
    this.addLinkStopPropagationListener();
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

      // Evita marcar como lida e evita navegação "hard refresh"
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

      // Links do backend costumam vir como "/client/..." (path absoluto na SPA)
      const path = href.startsWith("/") ? href : `/${href}`;
      this.router.navigateByUrl(path);
    };

    document.addEventListener("click", handler, true);
    this.linkListenerAdded = true;
  }

  closeSidebar(): void {
    this.visibleChange.emit(false);
    this.notificationsService.resetCount();
  }

  loadMore(): void {
    this.notificationsService.loadMore();
  }

  markAsRead(notification: Notification): void {
    this.notificationsService.markAsRead(notification.id);
  }

  markAllAsRead(): void {
    this.notificationsService.markAllAsRead();
  }

  refresh(): void {
    this.notificationsService.fetchAllNotifications().subscribe();
  }

  monitoringAccentClasses(
    notification: Notification
  ): Record<string, boolean> {
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
