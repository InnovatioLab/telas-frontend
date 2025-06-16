import { Component } from '@angular/core';

@Component({
  selector: 'app-icon-fechar',
  standalone: true,
  template: `
  <svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" viewBox="0 0 35 29" fill="none">
    <path d="M19.629 17.5001L27.7082 25.5792V27.7084H25.579L17.4998 19.6292L9.42067 27.7084H7.2915V25.5792L15.3707 17.5001L7.2915 9.42091V7.29175H9.42067L17.4998 15.3709L25.579 7.29175H27.7082V9.42091L19.629 17.5001Z" fill="currentColor"/>
  </svg>
  `,
  styles: [`
    :host {
      color: var(--cor-primaria) !important;
      display: inline-flex;
      width: 14px;
      height: 14px;
    }

    svg {
      width: 14px !important;
      height: 14px !important;
    }
  `]
})
export class IconFecharComponent {
}
