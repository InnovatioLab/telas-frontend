import { Component } from '@angular/core';

@Component({
  selector: 'icon-plus',
  standalone: true,
  template: `
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="11" y="4" width="2" height="16" rx="1" fill="currentColor"/>
      <rect x="4" y="11" width="16" height="2" rx="1" fill="currentColor"/>
    </svg>
  `,
  styles: [`:host { display: inline-flex; vertical-align: middle; line-height: 1; } svg { display: block; }`]
})
export class IconPlusComponent {} 