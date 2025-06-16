import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-icon-bolt',
  standalone: true,
  template: `
    <svg xmlns="http://www.w3.org/2000/svg" [attr.width]="width" [attr.height]="height" viewBox="0 0 24 24" [attr.fill]="fill">
      <path d="M7 2v13h3v7l7-12h-4l4-8z" [attr.fill]="fill"/>
    </svg>
  `
})
export class IconBoltComponent {
  @Input() width: string = '18';
  @Input() height: string = '18';
  @Input() fill: string = 'currentColor';
}
