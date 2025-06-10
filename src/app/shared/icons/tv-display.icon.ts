import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-icon-tv-display',
  standalone: true,
  template: `
  <svg xmlns="http://www.w3.org/2000/svg" [attr.width]="width" [attr.height]="height" viewBox="0 0 24 24" [attr.fill]="fill">
    <path d="M20 3H4C2.9 3 2 3.9 2 5V17C2 18.1 2.9 19 4 19H8V21H16V19H20C21.1 19 22 18.1 22 17V5C22 3.9 21.1 3 20 3ZM20 17H4V5H20V17Z" [attr.fill]="fill"/>
    <path d="M6 7H18V15H6V7Z" [attr.fill]="fill"/>
  </svg>
  `
})
export class IconTvDisplayComponent {
  @Input() width: string = '18';
  @Input() height: string = '18';
  @Input() fill: string = 'currentColor';
}
