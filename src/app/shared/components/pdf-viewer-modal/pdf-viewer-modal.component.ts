import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
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
  pdfSrc: SafeResourceUrl;
  title: string = '';
  isLoading: boolean = true;
  hasError: boolean = false;
  errorMessage: string = '';

  constructor(
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
    private readonly sanitizer: DomSanitizer
  ) {
    this.data = config.data;
    const urlWithParams = this.addViewOnlyParams(this.data.url);
    this.pdfSrc = this.sanitizer.bypassSecurityTrustResourceUrl(urlWithParams);
    this.title = this.data.title || 'Visualizar PDF';
  }

  private addViewOnlyParams(url: string): string {
    const params = 'toolbar=0&navpanes=0&scrollbar=1&view=FitH';
    
    if (url.includes('#')) {
      const [baseUrl] = url.split('#');
      return `${baseUrl}#${params}`;
    }
    
    return `${url}#${params}`;
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

    setTimeout(() => {
      if (this.isLoading) {
        this.isLoading = false;
      }
    }, 5000);
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
    this.isLoading = false;
    this.hasError = true;
    this.errorMessage = 'Erro ao carregar o PDF. Verifique se o arquivo está acessível.';
  }

  onLoadComplete(): void {
    this.isLoading = false;
    this.hasError = false;
  }
}

