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
      color: #ffffff !important;
    }
    
    .menu-trigger:hover {
      background-color: rgba(255, 255, 255, 0.15);
    }
    
    .menu-trigger.active {
      background-color: rgba(255, 255, 255, 0.2);
    }
    
    .menu-trigger:focus {
      outline: 2px solid rgba(255, 255, 255, 0.5);
      outline-offset: 2px;
    }

    .menu-trigger app-icon-bars {
      color: #ffffff !important;
    }

    .menu-trigger ::ng-deep svg,
    .menu-trigger svg {
      fill: #ffffff !important;
      color: #ffffff !important;
    }

    html[data-theme="dark"] .menu-trigger,
    html.dark-theme .menu-trigger,
    body.dark-theme .menu-trigger {
      color: var(--cor-icone-clara) !important;

      app-icon-bars {
        color: var(--cor-icone-clara) !important;
      }

      ::ng-deep svg,
      svg {
        fill: var(--cor-icone-clara) !important;
        color: var(--cor-icone-clara) !important;
      }
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










