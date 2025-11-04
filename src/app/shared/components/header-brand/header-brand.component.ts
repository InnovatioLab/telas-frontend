import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-header-brand',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="logo-container">
      <img
        src="assets/img/Logo-black.png"
        alt="Logo"
        class="header-logo"
        (click)="onLogoClick()"
        (keydown.enter)="onLogoClick()"
        tabindex="0"
        role="button"
        aria-label="Ir para página inicial"
      />
    </div>
  `,
  styles: [`
    .logo-container {
      cursor: pointer;
    }
    
    .header-logo {
      height: 40px;
      width: auto;
    }
  `]
})
export class HeaderBrandComponent {
  @Input() onLogoClickHandler?: () => void;

  onLogoClick(): void {
    if (this.onLogoClickHandler) {
      this.onLogoClickHandler();
    }
  }
}




