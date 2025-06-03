import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-icon-documento',
  standalone: true,
  template: `
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="21" viewBox="0 0 16 21" fill="none">
    <path d="M2 0.5C1.46957 0.5 0.960859 0.710714 0.585786 1.08579C0.210714 1.46086 0 1.96957 0 2.5V18.5C0 19.0304 0.210714 19.5391 0.585786 19.9142C0.960859 20.2893 1.46957 20.5 2 20.5H14C14.5304 20.5 15.0391 20.2893 15.4142 19.9142C15.7893 19.5391 16 19.0304 16 18.5V6.5L10 0.5H2ZM2 2.5H9V7.5H14V18.5H2V2.5ZM4 10.5V12.5H12V10.5H4ZM4 14.5V16.5H9V14.5H4Z" [attr.fill]="fill ?? 'currentColor'"/>
  </svg>
  `
})
export class IconDocumentoComponent {
  @Input() fill?: string;
}
