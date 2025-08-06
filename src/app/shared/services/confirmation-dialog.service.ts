import { Injectable } from '@angular/core';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ConfirmationDialogComponent } from '../components/confirmation-dialog/confirmation-dialog.component';
import { LayoutUtils } from '../utils/layout.utils';

export interface ConfirmationDialogData {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  severity?: 'info' | 'success' | 'warn' | 'error';
  width?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmationDialogService {

  constructor(private dialogService: DialogService) {}

  confirm(data: ConfirmationDialogData): Promise<boolean> {
    return new Promise((resolve) => {
      const ref: DynamicDialogRef = this.dialogService.open(
        ConfirmationDialogComponent,
        {
          data: data,
          header: data.title,
          width: LayoutUtils.getWidth(),
          modal: true,
          closable: true,
          closeOnEscape: true,
        }
      );

      ref.onClose.subscribe((result: boolean) => {
        resolve(result || false);
      });
    });
  }
} 