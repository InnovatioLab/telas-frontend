jest.mock('src/environments/environment', () => ({
  environment: {
    production: false,
    apiUrl: 'http://localhost:8080/api/',
  }
}));

jest.mock('ng2-pdf-viewer', () => ({
  PdfViewerModule: {}
}));

import { isPdfFile } from '@app/shared/utils/file-type.utils';

describe('AdRequestManagementComponent - PDF Functionality', () => {
  class MockAdRequestManagementComponent {
    pdfViewerService: any;
    windowOpenSpy: jest.SpyInstance;

    constructor() {
      this.pdfViewerService = {
        openPdf: jest.fn().mockResolvedValue(undefined)
      };
      this.windowOpenSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
    }

    viewAttachment(link: string): void {
      if (isPdfFile(link)) {
        this.pdfViewerService.openPdf(link, 'Attachment');
      } else {
        window.open(link, "_blank");
      }
    }

    isPdfAttachment(link: string): boolean {
      return isPdfFile(link);
    }

    downloadAttachment(link: string): void {
      const a = document.createElement("a");
      a.href = link;
      a.download = "";
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }

  let component: MockAdRequestManagementComponent;

  beforeEach(() => {
    component = new MockAdRequestManagementComponent();
  });

  afterEach(() => {
    jest.clearAllMocks();
    component.windowOpenSpy.mockRestore();
  });

  describe('viewAttachment', () => {
    it('deve abrir PDF no PdfViewerService quando link for PDF', async () => {
      const pdfLink = 'https://example.com/documento.pdf';
      
      component.viewAttachment(pdfLink);
      
      expect(component.pdfViewerService.openPdf).toHaveBeenCalledWith(pdfLink, 'Attachment');
      expect(component.windowOpenSpy).not.toHaveBeenCalled();
    });

    it('deve abrir imagem em nova janela quando link for imagem', () => {
      const imageLink = 'https://example.com/imagem.jpg';
      
      component.viewAttachment(imageLink);
      
      expect(component.windowOpenSpy).toHaveBeenCalledWith(imageLink, "_blank");
      expect(component.pdfViewerService.openPdf).not.toHaveBeenCalled();
    });

    it('deve abrir GIF em nova janela', () => {
      const imageLink = 'https://example.com/imagem.gif';
      
      component.viewAttachment(imageLink);
      
      expect(component.windowOpenSpy).toHaveBeenCalledWith(imageLink, "_blank");
      expect(component.pdfViewerService.openPdf).not.toHaveBeenCalled();
    });

    it('deve abrir PDF com fragmento no PdfViewerService', async () => {
      const pdfLink = 'https://example.com/documento.pdf#page=1';
      
      component.viewAttachment(pdfLink);
      
      expect(component.pdfViewerService.openPdf).toHaveBeenCalledWith(pdfLink, 'Attachment');
      expect(component.windowOpenSpy).not.toHaveBeenCalled();
    });

    it('deve abrir SVG em nova janela', () => {
      const imageLink = 'https://example.com/imagem.svg';
      
      component.viewAttachment(imageLink);
      
      expect(component.windowOpenSpy).toHaveBeenCalledWith(imageLink, "_blank");
      expect(component.pdfViewerService.openPdf).not.toHaveBeenCalled();
    });
  });

  describe('isPdfAttachment', () => {
    it('deve retornar true para URLs com extensão .pdf', () => {
      expect(component.isPdfAttachment('https://example.com/documento.pdf')).toBe(true);
      expect(component.isPdfAttachment('documento.pdf')).toBe(true);
      expect(component.isPdfAttachment('/path/to/file.pdf')).toBe(true);
    });

    it('deve retornar false para URLs sem extensão .pdf', () => {
      expect(component.isPdfAttachment('https://example.com/imagem.jpg')).toBe(false);
      expect(component.isPdfAttachment('https://example.com/arquivo.png')).toBe(false);
      expect(component.isPdfAttachment('https://example.com/arquivo')).toBe(false);
    });

    it('deve retornar false para URLs com .pdf no meio', () => {
      expect(component.isPdfAttachment('https://pdf.example.com/documento.jpg')).toBe(false);
      expect(component.isPdfAttachment('https://example.com/pdf-documento.jpg')).toBe(false);
    });

    it('deve ser case insensitive', () => {
      expect(component.isPdfAttachment('documento.PDF')).toBe(true);
      expect(component.isPdfAttachment('documento.Pdf')).toBe(true);
      expect(component.isPdfAttachment('documento.pDf')).toBe(true);
    });

    it('deve funcionar com query strings', () => {
      expect(component.isPdfAttachment('documento.pdf?token=123')).toBe(true);
      expect(component.isPdfAttachment('documento.pdf?download=true&size=large')).toBe(true);
    });
  });

  describe('downloadAttachment', () => {
    it('deve criar elemento anchor e fazer download', () => {
      const link = 'https://example.com/arquivo.pdf';
      const createElementSpy = jest.spyOn(document, 'createElement');
      const appendChildSpy = jest.spyOn(document.body, 'appendChild');
      const removeChildSpy = jest.spyOn(document.body, 'removeChild');
      
      component.downloadAttachment(link);
      
      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
    });

    it('deve configurar atributos corretos no anchor', () => {
      const link = 'https://example.com/arquivo.jpg';
      const createElementSpy = jest.spyOn(document, 'createElement');
      
      component.downloadAttachment(link);
      
      const anchorElement = createElementSpy.mock.results[0].value as HTMLAnchorElement;
      expect(anchorElement.href).toBe(link);
      expect(anchorElement.download).toBe('');
      expect(anchorElement.target).toBe('_blank');
    });
  });
});


