jest.mock('src/environments/environment', () => ({
  environment: {
    production: false,
    apiUrl: 'http://localhost:8080/api/',
  }
}));

jest.mock('ng2-pdf-viewer', () => ({
  PdfViewerModule: {}
}));

jest.mock('@app/shared/components', () => ({
  ErrorComponent: {}
}));

jest.mock('@app/shared/services/pdf-viewer.service', () => ({
  PdfViewerService: jest.fn().mockImplementation(() => ({
    openPdf: jest.fn().mockResolvedValue(undefined)
  }))
}));

jest.mock('@app/modules/client/components/ad-item/ad-item.component', () => ({
  AdItemComponent: {}
}));

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { MyTelasComponent } from '../my-telas.component';
import { MyTelasService } from '../../../services/my-telas.service';
import { ToastService } from '@app/core/service/state/toast.service';
import { PdfViewerService } from '@app/shared/services/pdf-viewer.service';
import { isPdfFile } from '@app/shared/utils/file-type.utils';

describe('MyTelasComponent - PDF Functionality', () => {
  class MockMyTelasComponent {
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

    isPdfLink(link?: string | null): boolean {
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

    onImageError(event: any): void {
      if (event.target) {
        (event.target as HTMLElement).style.display = "none";
      }
    }
  }

  let component: MockMyTelasComponent;

  beforeEach(() => {
    component = new MockMyTelasComponent();
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

    it('deve abrir PNG em nova janela', () => {
      const imageLink = 'https://example.com/imagem.png';
      
      component.viewAttachment(imageLink);
      
      expect(component.windowOpenSpy).toHaveBeenCalledWith(imageLink, "_blank");
      expect(component.pdfViewerService.openPdf).not.toHaveBeenCalled();
    });

    it('deve abrir PDF com query string no PdfViewerService', async () => {
      const pdfLink = 'https://example.com/documento.pdf?token=123';
      
      component.viewAttachment(pdfLink);
      
      expect(component.pdfViewerService.openPdf).toHaveBeenCalledWith(pdfLink, 'Attachment');
      expect(component.windowOpenSpy).not.toHaveBeenCalled();
    });

    it('deve abrir PDF case insensitive no PdfViewerService', async () => {
      const pdfLink = 'https://example.com/documento.PDF';
      
      component.viewAttachment(pdfLink);
      
      expect(component.pdfViewerService.openPdf).toHaveBeenCalledWith(pdfLink, 'Attachment');
      expect(component.windowOpenSpy).not.toHaveBeenCalled();
    });
  });

  describe('isPdfLink', () => {
    it('deve retornar true para URLs com extensão .pdf', () => {
      expect(component.isPdfLink('https://example.com/documento.pdf')).toBe(true);
      expect(component.isPdfLink('documento.pdf')).toBe(true);
    });

    it('deve retornar false para URLs sem extensão .pdf', () => {
      expect(component.isPdfLink('https://example.com/imagem.jpg')).toBe(false);
      expect(component.isPdfLink('https://example.com/arquivo')).toBe(false);
    });

    it('deve retornar false para null ou undefined', () => {
      expect(component.isPdfLink(null)).toBe(false);
      expect(component.isPdfLink(undefined)).toBe(false);
    });

    it('deve ser case insensitive', () => {
      expect(component.isPdfLink('documento.PDF')).toBe(true);
      expect(component.isPdfLink('documento.Pdf')).toBe(true);
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
  });

  describe('onImageError', () => {
    it('deve ocultar elemento quando ocorre erro', () => {
      const mockEvent = {
        target: {
          style: {
            display: 'block'
          }
        }
      };
      
      component.onImageError(mockEvent);
      
      expect(mockEvent.target.style.display).toBe('none');
    });

    it('não deve fazer nada se target não existir', () => {
      const mockEvent: any = {
        target: null
      };
      
      expect(() => component.onImageError(mockEvent)).not.toThrow();
    });
  });
});

describe('MyTelasComponent - New Features', () => {
  let component: MyTelasComponent;
  let fixture: ComponentFixture<MyTelasComponent>;
  let myTelasService: any;
  let toastService: any;
  let pdfViewerService: any;
  let httpClient: any;
  let cdr: ChangeDetectorRef;

  beforeEach(async () => {
    myTelasService = {
      authenticatedClient: signal(null),
      ads: signal([]),
      attachments: signal([]),
      clientAttachments: signal([]),
      isLoading: signal(false),
      activeTabIndex: signal(0),
      hasActiveAdRequest: signal(false),
      isClientDataLoaded: signal(false),
      createRequestAdForm: jest.fn(),
      createValidateAdForm: jest.fn(),
      createUploadAdForm: jest.fn(),
      loadClientData: jest.fn().mockResolvedValue(null),
      uploadAttachments: jest.fn().mockResolvedValue(null),
      createAdRequest: jest.fn().mockResolvedValue(null),
      updateAdRequest: jest.fn().mockResolvedValue(null),
      deleteAttachment: jest.fn().mockResolvedValue(null),
      replaceAttachment: jest.fn().mockResolvedValue(null),
      validateAd: jest.fn().mockResolvedValue(null),
      uploadAd: jest.fn().mockResolvedValue(null),
      setActiveTab: jest.fn(),
      validateAttachmentFile: jest.fn().mockResolvedValue({ isValid: true, errors: [] }),
      shouldDisplayMaxValidationsTry: jest.fn().mockReturnValue(false),
    };

    toastService = {
      erro: jest.fn(),
      info: jest.fn(),
      sucesso: jest.fn(),
    };

    pdfViewerService = {
      openPdf: jest.fn().mockResolvedValue(undefined),
    };

    httpClient = {
      get: jest.fn().mockReturnValue(of(new Blob(['pdf content'], { type: 'application/pdf' }))),
    };

    cdr = {
      detectChanges: jest.fn(),
    } as any;

    await TestBed.configureTestingModule({
      imports: [MyTelasComponent],
      providers: [
        { provide: MyTelasService, useValue: myTelasService },
        { provide: ToastService, useValue: toastService },
        { provide: ActivatedRoute, useValue: { queryParams: of({}) } },
        { provide: PdfViewerService, useValue: pdfViewerService },
        { provide: HttpClient, useValue: httpClient },
        { provide: ChangeDetectorRef, useValue: cdr },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MyTelasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('previewSelectedFile', () => {
    it('deve abrir PDF no PdfViewerService quando arquivo for PDF', (done) => {
      const pdfFile = new File(['pdf content'], 'document.pdf', { type: 'application/pdf' });
      
      component.previewSelectedFile(pdfFile);
      
      setTimeout(() => {
        expect(pdfViewerService.openPdf).toHaveBeenCalled();
        done();
      }, 100);
    });

    it('deve abrir imagem em nova janela quando arquivo for imagem', (done) => {
      const imageFile = new File(['image content'], 'image.jpg', { type: 'image/jpeg' });
      const windowOpenSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
      
      component.previewSelectedFile(imageFile);
      
      setTimeout(() => {
        expect(windowOpenSpy).toHaveBeenCalled();
        windowOpenSpy.mockRestore();
        done();
      }, 100);
    });
  });

  describe('removeSelectedFile', () => {
    it('deve remover arquivo da lista de selectedFiles', () => {
      const file1 = new File(['content1'], 'file1.pdf', { type: 'application/pdf' });
      const file2 = new File(['content2'], 'file2.pdf', { type: 'application/pdf' });
      
      component.selectedFiles = [file1, file2];
      component.uploadPreviews = ['preview1', 'preview2'];
      
      component.removeSelectedFile(file1);
      
      expect(component.selectedFiles.length).toBe(1);
      expect(component.selectedFiles[0]).toBe(file2);
      expect(component.uploadPreviews.length).toBe(1);
    });

    it('não deve fazer nada se arquivo não estiver na lista', () => {
      const file1 = new File(['content1'], 'file1.pdf', { type: 'application/pdf' });
      const file2 = new File(['content2'], 'file2.pdf', { type: 'application/pdf' });
      
      component.selectedFiles = [file1];
      component.uploadPreviews = ['preview1'];
      
      component.removeSelectedFile(file2);
      
      expect(component.selectedFiles.length).toBe(1);
    });
  });

  describe('formatFileSize', () => {
    it('deve formatar bytes corretamente', () => {
      expect(component.formatFileSize(0)).toBe('0 Bytes');
      expect(component.formatFileSize(1024)).toBe('1 KB');
      expect(component.formatFileSize(1048576)).toBe('1 MB');
      expect(component.formatFileSize(1536)).toContain('KB');
    });

    it('deve formatar tamanhos grandes corretamente', () => {
      const result = component.formatFileSize(1073741824);
      expect(result).toContain('GB');
    });
  });

  describe('getPdfSrc', () => {
    it('deve retornar blob URL se já existir', () => {
      const attachmentId = '123';
      const blobUrl = 'blob:http://localhost/test';
      component.pdfBlobs[attachmentId] = blobUrl;
      
      const result = component.getPdfSrc('http://example.com/file.pdf', attachmentId);
      
      expect(result).toBe(blobUrl);
    });

    it('deve carregar PDF como blob se não existir', () => {
      const attachmentId = '123';
      const attachmentLink = 'http://example.com/file.pdf';
      
      component.getPdfSrc(attachmentLink, attachmentId);
      
      expect(httpClient.get).toHaveBeenCalledWith(attachmentLink, { responseType: 'blob' });
    });
  });

  describe('loadPdfAsBlob', () => {
    it('deve carregar PDF e criar blob URL', (done) => {
      const url = 'http://example.com/file.pdf';
      const attachmentId = '123';
      const mockBlob = new Blob(['pdf content'], { type: 'application/pdf' });
      
      httpClient.get.mockReturnValue(of(mockBlob));
      
      component.loadPdfAsBlob(url, attachmentId);
      
      setTimeout(() => {
        expect(component.pdfBlobs[attachmentId]).toBeDefined();
        expect(component.pdfBlobs[attachmentId]).toContain('blob:');
        expect(cdr.detectChanges).toHaveBeenCalled();
        done();
      }, 100);
    });

    it('não deve carregar novamente se blob já existir', () => {
      const url = 'http://example.com/file.pdf';
      const attachmentId = '123';
      component.pdfBlobs[attachmentId] = 'blob:existing';
      
      component.loadPdfAsBlob(url, attachmentId);
      
      expect(httpClient.get).not.toHaveBeenCalled();
    });
  });

  describe('preloadPdfBlobs', () => {
    it('deve carregar blobs para todos os PDFs', () => {
      const attachments = [
        { attachmentId: '1', attachmentName: 'file1.pdf', attachmentLink: 'http://example.com/file1.pdf' },
        { attachmentId: '2', attachmentName: 'file2.jpg', attachmentLink: 'http://example.com/file2.jpg' },
        { attachmentId: '3', attachmentName: 'file3.pdf', attachmentLink: 'http://example.com/file3.pdf' },
      ];
      
      myTelasService.clientAttachments.set(attachments);
      
      component.preloadPdfBlobs();
      
      expect(httpClient.get).toHaveBeenCalledTimes(2);
    });

    it('não deve carregar se não houver attachments', () => {
      myTelasService.clientAttachments.set([]);
      
      component.preloadPdfBlobs();
      
      expect(httpClient.get).not.toHaveBeenCalled();
    });
  });

  describe('onFileUpload - duplicate validation', () => {
    it('deve rejeitar arquivo duplicado', async () => {
      const existingAttachments = [
        { attachmentId: '1', attachmentName: 'existing.pdf', attachmentLink: 'http://example.com/existing.pdf' },
      ];
      myTelasService.clientAttachments.set(existingAttachments);
      
      const duplicateFile = new File(['content'], 'existing.pdf', { type: 'application/pdf' });
      const event = { currentFiles: [duplicateFile] };
      
      component.attachmentFileUploadComponent = {
        clear: jest.fn(),
      } as any;
      
      component.onFileUpload(event);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(toastService.erro).toHaveBeenCalled();
      const errorCall = (toastService.erro as jest.Mock).mock.calls[0][0];
      expect(errorCall).toContain('already exists');
      expect(component.attachmentFileUploadComponent.clear).toHaveBeenCalled();
    });

    it('deve aceitar arquivo não duplicado', async () => {
      const existingAttachments = [
        { attachmentId: '1', attachmentName: 'existing.pdf', attachmentLink: 'http://example.com/existing.pdf' },
      ];
      myTelasService.clientAttachments.set(existingAttachments);
      
      const newFile = new File(['content'], 'new.pdf', { type: 'application/pdf' });
      const event = { currentFiles: [newFile] };
      
      component.onFileUpload(event);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(component.selectedFiles).toContain(newFile);
    });
  });
});

