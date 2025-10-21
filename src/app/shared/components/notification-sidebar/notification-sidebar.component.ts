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
    const sidebar = this.elRef.nativeElement.querySelector(
      ".notification-sidebar"
    );
    if (!sidebar) return;
    sidebar.addEventListener(
      "click",
      (event: Event) => {
        const target = event.target as HTMLElement;
        const linkTarget =
          target.tagName === "A" &&
          target.classList.contains("link-text") &&
          target.closest(".notification-content");

        if (linkTarget) {
          event.stopPropagation();
        }
      },
      true
    );
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
}
