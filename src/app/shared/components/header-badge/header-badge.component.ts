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
    >
      {{ count }}
    </span>
  `,
  styles: [
    `
      .badge {
        position: absolute;
        top: -8px;
        right: -8px;
        background-color: #ff4444;
        color: #ffffff;
        border-radius: 50%;
        min-width: 20px;
        height: 20px;
        font-size: 12px;
        font-weight: 700;
      }
    `,
  ],
})
export class HeaderBadgeComponent {
  @Input() count = 0;
}







