import { Component } from "@angular/core";

@Component({
  selector: "app-icon-box",
  standalone: true,
  template: `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        d="M21 16.5c0 .38-.21.71-.53.88l-7.9 4.44c-.16.09-.34.14-.53.14-.19 0-.37-.05-.53-.14l-7.9-4.44A.991.991 0 0 1 3 16.5v-9l8.05-4.52c.16-.09.34-.14.53-.14s.37.05.53.14L21 7.5v9zM12 4.15 5.81 5.1 12 8.85l6.19-3.75L12 4.15zM5 8.85l6.19 3.75L17 8.85v5.6l-5 2.81V11.1L5 9.29V8.85z"
      />
    </svg>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      svg {
        width: 100%;
        height: 100%;
        fill: currentColor;
      }
    `,
  ],
})
export class IconBoxComponent {}
