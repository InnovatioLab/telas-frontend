import { Component } from '@angular/core';

@Component({
  selector: 'app-icon-upload',
  standalone: true,
  template: `
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="18" viewBox="0 0 20 18" fill="none">
    <path d="M0 10.5H2V15.5H18V10.5H20V15.5C20 16.61 19.11 17.5 18 17.5H2C0.9 17.5 0 16.61 0 15.5V10.5ZM10 0.5L4.46 5.96L5.88 7.38L9 4.25V13.5H11V4.25L14.13 7.38L15.55 5.95L10 0.5Z" fill="currentColor"/>
  </svg>
  `
})
export class IconUploadComponent {
}
