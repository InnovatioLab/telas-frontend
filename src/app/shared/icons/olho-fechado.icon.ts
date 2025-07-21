import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-icon-olho-fechado',
  standalone: true,
  template: `
  <svg xmlns="http://www.w3.org/2000/svg" [attr.width]="size" [attr.height]="size" viewBox="0 0 24 24" fill="none">
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12zm11-5a5 5 0 100 10 5 5 0 000-10zm0 8a3 3 0 110-6 3 3 0 010 6z" fill="currentColor"/>
  </svg>
  `,
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    
    svg {
      display: block;
    }
  `]
})
export class IconOlhoFechadoComponent {
  @Input() size: number | string = 24;
}
