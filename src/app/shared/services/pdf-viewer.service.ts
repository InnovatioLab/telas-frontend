import { Injectable } from '@angular/core';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { PdfViewerModalComponent } from '../components/pdf-viewer-modal/pdf-viewer-modal.component';
import { LayoutUtils } from '../utils/layout.utils';

export interface PdfViewerData {
  url: string;
  title?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PdfViewerService {

  constructor(private dialogService: DialogService) {}

  openPdf(url: string, title?: string): Promise<void> {
    return new Promise((resolve) => {
      const data: PdfViewerData = {
        url,
        title
      };

      const ref: DynamicDialogRef = this.dialogService.open(
        PdfViewerModalComponent,
        {
          data: data,
          showHeader: false,
          width: LayoutUtils.getWidth(),
          height: '90vh',
          modal: true,
          closable: false,
          closeOnEscape: true,
          baseZIndex: 10000,
          contentStyle: {
            overflow: 'hidden',
            padding: '0',
            height: '100%'
          },
          styleClass: 'pdf-viewer-dialog'
        }
      );

      ref.onClose.subscribe(() => {
        resolve();
      });
    });
  }
}

