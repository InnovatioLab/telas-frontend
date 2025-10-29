import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimengModule } from '@app/shared/primeng/primeng.module';
import { IconsModule } from '@app/shared/icons/icons.module';

@Component({
  selector: 'app-header-actions',
  standalone: true,
  imports: [CommonModule, PrimengModule, IconsModule],
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
        <span
          *ngIf="cartItemCount > 0"
          class="badge flex justify-content-center align-items-center absolute"
        >
          {{ cartItemCount }}
        </span>
      </button>

      <!-- Admin Settings Button -->
      <button
        *ngIf="isAdministrator"
        class="icon-button"
        (click)="onAdminClick()"
        title="Admin settings"
      >
        <app-icon-settings class="icon cursor-pointer icon-fill"></app-icon-settings>
      </button>

      <!-- Notifications Button (for non-admin users) -->
      <button
        *ngIf="!isAdministrator"
        (click)="onNotificationsClick()"
        class="icon-button"
        title="View notifications"
      >
        <app-icon-notifications class="icon cursor-pointer"></app-icon-notifications>
        <span
          *ngIf="notificationCount > 0"
          class="badge flex justify-content-center align-items-center absolute"
        >
          {{ notificationCount }}
        </span>
      </button>
    </div>
  `,
  styles: [`
    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
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
      color: white;
    }
    
    .icon-button:hover {
      background-color: rgba(255, 255, 255, 0.1);
      color: white;
    }
    
    .icon-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      color: white;
    }
    
    .icon-button:disabled:hover {
      background-color: transparent;
      color: white;
    }
    
    .badge {
      position: absolute;
      top: -8px;
      right: -8px;
      background-color: #ff4444;
      color: white;
      border-radius: 50%;
      min-width: 20px;
      height: 20px;
      font-size: 12px;
      font-weight: bold;
    }
  `]
})
export class HeaderActionsComponent {
  @Input() isAdministrator = false;
  @Input() cartItemCount = 0;
  @Input() notificationCount = 0;
  @Input() cartTooltip = '';
  @Output() checkoutClick = new EventEmitter<void>();
  @Output() adminClick = new EventEmitter<void>();
  @Output() notificationsClick = new EventEmitter<void>();

  get hasActiveCart(): boolean {
    return this.cartItemCount > 0;
  }

  onCheckoutClick(): void {
    this.checkoutClick.emit();
  }

  onAdminClick(): void {
    this.adminClick.emit();
  }

  onNotificationsClick(): void {
    this.notificationsClick.emit();
  }
}

