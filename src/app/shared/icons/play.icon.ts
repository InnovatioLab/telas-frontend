import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-icon-play',
  standalone: true,
  template: `
    <svg xmlns="http://www.w3.org/2000/svg" [attr.width]="width" [attr.height]="height" viewBox="0 0 24 24" [attr.fill]="fill">
      <polygon points="5,3 19,12 5,21" [attr.fill]="fill"/>
    </svg>
  `
})
export class IconPlayComponent {
  @Input() width: string = '18';
  @Input() height: string = '18';
  @Input() fill: string = 'currentColor';
}
