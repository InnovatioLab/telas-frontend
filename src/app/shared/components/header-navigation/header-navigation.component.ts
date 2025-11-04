import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IconsModule } from '@app/shared/icons/icons.module';

@Component({
  selector: 'app-header-navigation',
  standalone: true,
  imports: [CommonModule, IconsModule],
  template: `
    <div
      class="menu-trigger"
      *ngIf="isLoggedIn && !isProfileManagementRoute"
      [ngClass]="{ active: isMenuOpen }"
      (click)="onMenuToggle()"
      (keydown.enter)="onMenuToggle()"
      (keydown.space)="onMenuToggle()"
      tabindex="0"
      role="button"
      aria-label="Open Side Menu"
      [attr.aria-expanded]="isMenuOpen"
    >
      <app-icon-bars></app-icon-bars>
    </div>
  `,
  styles: [`
    .menu-trigger {
      cursor: pointer;
      padding: 8px;
      border-radius: 4px;
      transition: background-color 0.2s;
    }
    
    .menu-trigger:hover {
      background-color: rgba(0, 0, 0, 0.1);
    }
    
    .menu-trigger.active {
      background-color: rgba(0, 0, 0, 0.2);
    }
    
    .menu-trigger:focus {
      outline: 2px solid #007bff;
      outline-offset: 2px;
    }
  `]
})
export class HeaderNavigationComponent {
  @Input() isLoggedIn = false;
  @Input() isMenuOpen = false;
  @Input() isProfileManagementRoute = false;
  @Output() menuToggle = new EventEmitter<void>();

  onMenuToggle(): void {
    this.menuToggle.emit();
  }
}




