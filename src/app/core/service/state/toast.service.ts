import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

@Injectable({ providedIn: 'root' })
export class ToastService {
  constructor(private messageService: MessageService) {}

  success(message: string, duration = 3000) {
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: message,
      life: duration,
      closable: true
    });
  }

  error(message: string, duration = 3000) {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: message,
      life: duration,
      closable: true
    });
  }

  info(message: string, duration = 3000) {
    this.messageService.add({
      severity: 'info',
      summary: 'Info',
      detail: message,
      life: duration,
      closable: true
    });
  }

  warn(message: string, duration = 3000) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Warning',
      detail: message,
      life: duration,
      closable: true
    });
  }

  custom(severity: string, summary: string, detail: string, life = 3000) {
    this.messageService.add({ severity, summary, detail, life });
  }

  clear() {
    this.messageService.clear();
  }
}
