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
        width: 100%;
        transition: padding-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        background-color: var(--cor-cinza-fundo);
        box-sizing: border-box;
        min-height: calc(100vh - 70px);
      }

      .content-container {
        padding: 1.5rem;
        max-width: 1600px;
        margin: 0 auto;
        width: 100%;
        box-sizing: border-box;
        /* Remove altura fixa para permitir altura natural do conteúdo */
        min-height: inherit;
      }

      .content-wrapper.menu-active.mobile {
        padding-left: 150px !important;
      }

      .content-wrapper.menu-active.mobile-compact {
        padding-left: 70px !important;
      }

      /* Ajustes específicos para mobile */
      @media screen and (max-width: 768px) {
        .content-container {
          padding: 1rem;
        }

        .content-wrapper {
          min-height: calc(100vh - 70px);
        }
      }

      @media screen and (max-width: 480px) {
        .content-container {
          padding: 0.75rem;
        }

        .content-wrapper {
          min-height: calc(100vh - 70px);
        }
      }

      /* Previne scroll horizontal */
      .content-container * {
        max-width: 100%;
        box-sizing: border-box;
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
