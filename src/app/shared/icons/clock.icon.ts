import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-icon-clock',
  standalone: true,
  template: `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      [attr.width]="width"
      [attr.height]="height"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        [attr.stroke]="fill"
        stroke-width="2"
      />
      <path
        d="M12 7v5l3.5 2"
        [attr.stroke]="fill"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  `
})
export class IconClockComponent {
  @Input() width: string = '18';
  @Input() height: string = '18';
  @Input() fill: string = 'currentColor';
}
