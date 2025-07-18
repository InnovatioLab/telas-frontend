import { Injectable, NgZone } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CustomMessageService {
  messages = new Subject<any>();
  constructor() {}

  showMessage(severity: string, summary: string, detail: string, life = 10000): void {
    this.messages.next({ severity, summary, detail, life });
  }

  showSuccess(detail: string) {
    this.showMessage('success', 'Success', detail);
  }

  showWarning(detail: string) {
    this.showMessage('warn', 'Warning', detail);
  }

  showError(detail: string) {
    this.showMessage('error', 'Error', detail);
  }
}
