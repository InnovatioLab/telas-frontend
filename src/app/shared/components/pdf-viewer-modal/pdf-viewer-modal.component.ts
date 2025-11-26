import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { IconFecharComponent } from '../../icons/fechar.icon';
import { LayoutUtils } from '../../utils/layout.utils';
import { PdfViewerData } from '../../services/pdf-viewer.service';

@Component({
  selector: 'app-pdf-viewer-modal',
  standalone: true,
  imports: [
    CommonModule,
    PdfViewerModule,
    IconFecharComponent
  ],
  templateUrl: './pdf-viewer-modal.component.html',
  styleUrls: ['./pdf-viewer-modal.component.scss']
})
export class PdfViewerModalComponent implements OnInit, OnDestroy {
  data: PdfViewerData;
  pdfSrc: string = '';
  title: string = '';

  constructor(
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig
  ) {
    this.data = config.data;
    this.pdfSrc = this.data.url;
    this.title = this.data.title || 'Visualizar PDF';
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.config.width = LayoutUtils.getWidth();
  }

  ngOnInit(): void {
    this.onResize();
    
    if (!document.querySelector('.sidebar-carrinho')) {
      document.body.style.overflow = 'hidden';
    }
  }

  ngOnDestroy(): void {
    if (!document.querySelector('.sidebar-carrinho')) {
      document.body.style.overflow = 'auto';
    }
  }

  close(): void {
    this.ref.close();
  }

  onError(error: any): void {
    console.error('Erro ao carregar PDF:', error);
  }
}

