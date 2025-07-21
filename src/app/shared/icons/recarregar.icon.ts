import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-icon-recarregar',
  standalone: true,
  template: `
  <svg xmlns="http://www.w3.org/2000/svg" [attr.width]="size" [attr.height]="size" width="24" height="30" viewBox="0 0 24 19" fill="none">
    <path d="M2 12.5C2 17.47 6.03 21.5 11 21.5C13.39 21.5 15.68 20.56 17.4 18.9L15.9 17.4C14.63 18.75 12.86 19.5 11 19.5C4.76 19.5 1.64 11.96 6.05 7.55C10.46 3.14 18 6.27 18 12.5H15L19 16.5H19.1L23 12.5H20C20 7.53 15.97 3.5 11 3.5C6.03 3.5 2 7.53 2 12.5Z" fill="#430092"/>
  </svg>
  `
})
export class IconRecarregarComponent {
  @Input() size: number | string = 24;
}
