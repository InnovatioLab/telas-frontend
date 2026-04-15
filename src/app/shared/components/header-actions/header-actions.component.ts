import { Component, Input, Output, EventEmitter } from "@angular/core";
import { CommonModule } from "@angular/common";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { IconsModule } from "@app/shared/icons/icons.module";
import { HeaderBadgeComponent } from "@app/shared/components/header-badge/header-badge.component";

@Component({
  selector: "app-header-actions",
  standalone: true,
  imports: [CommonModule, PrimengModule, IconsModule, HeaderBadgeComponent],
  template: `
    <div class="header-actions">
      <!-- Cart Button (for non-admin users) -->
      <button
        *ngIf="!isAdministrator"
        (click)="onCheckoutClick()"
        class="icon-button"
        [title]="cartTooltip"
        [disabled]="!hasActiveCart"
      >
        <app-icon-shopping-basket></app-icon-shopping-basket>
        <app-header-badge [count]="cartItemCount"></app-header-badge>
      </button>

      <!-- Notifications (all logged-in roles) -->
      <button
        type="button"
        (click)="onNotificationsClick()"
        class="icon-button icon-button--notifications"
        [attr.aria-label]="
          notificationCount > 0
            ? 'Notificações, ' + notificationCount + ' não lidas'
            : 'Notificações'
        "
        title="Notificações"
      >
        <app-icon-notifications
          class="icon cursor-pointer on-primary-header"
        ></app-icon-notifications>
        <app-header-badge [count]="notificationCount"></app-header-badge>
      </button>
    </div>
  `,
  styles: [
    `
      .header-actions {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
        min-width: 0;
      }

      .icon-button {
        position: relative;
        cursor: pointer;
        background: none;
        border: none;
        padding: 8px;
        border-radius: 4px;
        transition: background-color 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ffffff;
        flex-shrink: 0;
      }

      @media (max-width: 400px) {
        .header-actions {
          gap: 4px;
        }

        .icon-button {
          padding: 4px;
        }
      }

      .icon-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        color: #ffffff;
      }

      .icon-button:not(:disabled):hover {
        background-color: rgba(255, 255, 255, 0.14);
      }

      .icon-button:not(:disabled):focus-visible {
        outline: 2px solid rgba(255, 255, 255, 0.85);
        outline-offset: 2px;
      }
    `,
  ]
})
export class HeaderActionsComponent {
  @Input() isAdministrator = false;
  @Input() cartItemCount = 0;
  @Input() notificationCount = 0;
  @Input() cartTooltip = "";
  @Output() checkoutClick = new EventEmitter<void>();
  @Output() notificationsClick = new EventEmitter<void>();

  get hasActiveCart(): boolean {
    return this.cartItemCount > 0;
  }

  onCheckoutClick(): void {
    this.checkoutClick.emit();
  }

  onNotificationsClick(): void {
    this.notificationsClick.emit();
  }
}

