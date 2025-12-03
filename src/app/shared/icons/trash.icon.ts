import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";

@Component({
  selector: "app-icon-trash",
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg
      [attr.width]="size"
      [attr.height]="size"
      viewBox="0 0 24 24"
      [attr.fill]="fill"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
        [attr.fill]="fill"
      />
    </svg>
  `,
})
export class IconTrashComponent {
  @Input() size: number | string = 24;
  @Input() fill: string = "currentColor";
}
