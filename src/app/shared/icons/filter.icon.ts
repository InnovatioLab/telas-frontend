import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-icon-filter',
  standalone: true,
  template: `
    <svg xmlns="http://www.w3.org/2000/svg" [attr.width]="width" [attr.height]="height" viewBox="0 0 24 24" [attr.fill]="fill">
      <path d="M10 18h4v-2h-4v2zm-7-8v2h18v-2H3zm3-6v2h12V4H6zm-3 14v2h18v-2H3z" [attr.fill]="fill"/>
    </svg>
  `
})
export class IconFilterComponent {
  @Input() width: string = '18';
  @Input() height: string = '18';
  @Input() fill: string = 'currentColor';
}
