import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-icon-notifications',
  standalone: true,
  template: `
  <svg xmlns="http://www.w3.org/2000/svg" [attr.width]="size" [attr.height]="size" viewBox="0 0 24 24" fill="none">
    <path d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.36 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.63 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16Z" [attr.fill]="color"/>
  </svg>
  `
})
export class IconNotificationsComponent {
  @Input() color: string = '#6b7280';
  @Input() size: number = 24;
}
