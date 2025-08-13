import { Component } from "@angular/core";

@Component({
  selector: "app-icon-mail",
  standalone: true,
  template: `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" fill="none"/>
      <path d="M2 6.75A2.75 2.75 0 0 1 4.75 4h14.5A2.75 2.75 0 0 1 22 6.75v10.5A2.75 2.75 0 0 1 19.25 20H4.75A2.75 2.75 0 0 1 2 17.25V6.75Zm2.75-1.25a1.25 1.25 0 0 0-1.25 1.25v.38l9.25 6.16 9.25-6.16v-.38a1.25 1.25 0 0 0-1.25-1.25H4.75Zm15.5 2.62-7.72 5.15a1 1 0 0 1-1.06 0L4.75 8.12V17.25c0 .69.56 1.25 1.25 1.25h14.5c.69 0 1.25-.56 1.25-1.25V8.12Z" fill="currentColor"/>
    </svg>
  `
})
export class IconMailComponent {}
