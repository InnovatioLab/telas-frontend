import { Component, Input } from "@angular/core";

@Component({
  selector: "app-icon-upload",
  standalone: true,
  template: `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      [attr.width]="size"
      [attr.height]="size"
      viewBox="0 0 24 24"
      [attr.fill]="fill"
    >
      <path
        d="M12 16l-4-4h3V4h2v8h3l-4 4zM4 20h16v-2H4v2z"
        [attr.fill]="fill"
        transform="translate(0,2)"
      />
    </svg>
  `,
})
export class IconUploadComponent {
  @Input() size: number | string = 24;
  @Input() fill: string = "currentColor";
}
