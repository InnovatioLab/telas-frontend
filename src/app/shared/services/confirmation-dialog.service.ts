import { Injectable } from '@angular/core';
import { DynamicDialogRef, DialogService } from 'primeng/dynamicdialog';
import { ConfirmationDialogComponent } from '../components/confirmation-dialog/confirmation-dialog.component';

export interface ConfirmationDialogData {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  severity?: 'info' | 'success' | 'warn' | 'error';
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmationDialogService {

  constructor(private dialogService: DialogService) {}

  confirm(data: ConfirmationDialogData): Promise<boolean> {
    return new Promise((resolve) => {
      const ref: DynamicDialogRef = this.dialogService.open(ConfirmationDialogComponent, {
        data: data,
        header: data.title,
        width: '400px',
        modal: true,
        closable: true,
        closeOnEscape: true
      });

      ref.onClose.subscribe((result: boolean) => {
        resolve(result || false);
      });
    });
  }
} 