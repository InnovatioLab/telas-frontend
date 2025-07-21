import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-icon-home',
  standalone: true,
  template: `
  <svg xmlns="http://www.w3.org/2000/svg" [attr.width]="size" [attr.height]="size" viewBox="0 0 24 24" fill="none">
    <path d="M10 20V14H14V20H19V12H22L12 3L2 12H5V20H10Z" fill="currentColor"/>
  </svg>
  `
})
export class IconHomeComponent {
  @Input() size: number | string = 24;
}
