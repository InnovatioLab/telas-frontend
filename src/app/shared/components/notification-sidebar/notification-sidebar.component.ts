import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimengModule } from '@app/shared/primeng/primeng.module';
import { NotificationsService } from '@app/core/service/api/notifications.service';

import { Notification } from '@app/modules/notificacao/models/notification';

@Component({
  selector: 'app-notification-sidebar',
  standalone: true,
  imports: [CommonModule, PrimengModule],
  templateUrl: './notification-sidebar.component.html',
  styleUrls: ['./notification-sidebar.component.scss']
})
export class NotificationSidebarComponent {
  @Input() visible: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  public readonly notificationsService = inject(NotificationsService);

  closeSidebar(): void {
    this.visibleChange.emit(false);
  }

  loadMore(): void {
    this.notificationsService.loadMore();
  }

  markAsRead(notification: Notification): void {
    this.notificationsService.markAsRead(notification.id);
  }
}