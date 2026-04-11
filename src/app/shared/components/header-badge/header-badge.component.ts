import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";

@Component({
  selector: "app-header-badge",
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      *ngIf="count > 0"
      class="badge flex justify-content-center align-items-center absolute"
      [attr.aria-label]="count + ' não lidas'"
    >
      {{ displayText }}
    </span>
  `,
  styles: [
    `
      .badge {
        position: absolute;
        top: -4px;
        right: -4px;
        z-index: 3;
        background-color: #dc2626;
        color: #ffffff;
        border-radius: 999px;
        min-width: 18px;
        height: 18px;
        padding: 0 4px;
        font-size: 10px;
        font-weight: 700;
        line-height: 1;
        border: 2px solid #ffffff;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.35);
        box-sizing: border-box;
      }

      @media (min-width: 769px) {
        .badge {
          top: -6px;
          right: -6px;
          min-width: 20px;
          height: 20px;
          font-size: 11px;
        }
      }
    `,
  ],
})
export class HeaderBadgeComponent {
  @Input() count = 0;

  get displayText(): string {
    if (this.count > 99) {
      return "99+";
    }
    return String(this.count);
  }
}
