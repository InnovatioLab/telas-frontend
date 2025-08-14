import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { LayoutService } from "@app/core/service/state/layout.service";

@Component({
  selector: "app-content-wrapper",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="content-wrapper"
      [ngClass]="{
        'menu-active': isMenuOpen(),
        mobile: isMobile(),
        'mobile-compact': isMobileCompact(),
      }"
      [style.padding-left.px]="contentPadding()"
    >
      <ng-content></ng-content>
    </div>
  `,
  styles: [
    `
      .content-wrapper {
        min-height: 100vh;
        transition: padding-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        background-color: var(--cor-branca);

        &.menu-active {
          padding-left: 200px;

          &.mobile {
            padding-left: 150px !important;
          }

          &.mobile-compact {
            padding-left: 70px !important;
          }
        }
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
