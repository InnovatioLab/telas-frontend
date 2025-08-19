import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { RouterModule } from "@angular/router";
import { LayoutService } from "@app/core/service/state/layout.service";

@Component({
  selector: "app-content-wrapper",
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <main
      class="content-wrapper"
      [ngClass]="{
        'menu-active': isMenuOpen(),
        mobile: isMobile(),
        'mobile-compact': isMobileCompact(),
      }"
      [style.padding-left.px]="contentPadding()"
    >
      <div class="content-container">
        <router-outlet></router-outlet>
      </div>
    </main>
  `,
  styles: [
    `
      .content-wrapper {
        height: 100vh;
        transition: padding-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        background-color: var(--cor-branca);
        box-sizing: border-box;
        flex: 1;
        display: flex;
        flex-direction: column;
      }

      .content-container {
        flex: 1;
        padding: 1.5rem;
        padding-top: 90px;
        max-width: 1600px;
        margin: 0 auto;
        width: 100%;
        box-sizing: border-box;
      }

      .content-wrapper.menu-active {
        padding-left: 200px;
      }

      .content-wrapper.menu-active.mobile {
        padding-left: 150px !important;
      }

      .content-wrapper.menu-active.mobile-compact {
        padding-left: 70px !important;
      }
    `,
  ],
})
export class ContentWrapperComponent {
  private readonly layoutService = inject(LayoutService);

  isMenuOpen = this.layoutService.isMenuOpen;
  isMobile = this.layoutService.isMobile;
  isMobileCompact = this.layoutService.isMobileCompact;

  // Computed property para calcular o padding baseado no estado do layout
  contentPadding = this.layoutService.contentMargin;
}
