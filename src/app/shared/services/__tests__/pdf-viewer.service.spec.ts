jest.mock('src/environments/environment', () => ({
  environment: {
    production: false,
    apiUrl: 'http://localhost:8080/api/',
  }
}));

jest.mock('../../components/pdf-viewer-modal/pdf-viewer-modal.component', () => ({
  PdfViewerModalComponent: class {}
}));

jest.mock('ng2-pdf-viewer', () => ({
  PdfViewerModule: {}
}));

import { TestBed } from '@angular/core/testing';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { PdfViewerModalComponent } from '../../components/pdf-viewer-modal/pdf-viewer-modal.component';
import { LayoutUtils } from '../../utils/layout.utils';
import { PdfViewerService } from '../pdf-viewer.service';

describe('PdfViewerService', () => {
  let service: PdfViewerService;
  let mockDialogService: jest.Mocked<DialogService>;
  let mockDialogRef: jest.Mocked<DynamicDialogRef>;

  beforeEach(() => {
    mockDialogRef = {
      onClose: {
        subscribe: jest.fn((callback) => {
          return { unsubscribe: jest.fn() };
        })
      },
      close: jest.fn()
    } as any;

    mockDialogService = {
      open: jest.fn().mockReturnValue(mockDialogRef)
    } as any;

    TestBed.configureTestingModule({
      providers: [
        PdfViewerService,
        { provide: DialogService, useValue: mockDialogService }
      ]
    });

    service = TestBed.inject(PdfViewerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('deve ser criado', () => {
      expect(service).toBeTruthy();
    });
  });

  describe('openPdf', () => {
    it('deve abrir o modal de PDF com URL e título', (done) => {
      const url = 'https://example.com/documento.pdf';
      const title = 'Documento Teste';

      const promise = service.openPdf(url, title);

      const callArgs = mockDialogService.open.mock.calls[0];
      expect(callArgs[0]).toBe(PdfViewerModalComponent);
      const config = callArgs[1];
      expect(config.data).toEqual({ url, title });
      expect(config.showHeader).toBe(false);
      expect(config.modal).toBe(true);
      expect(config.closable).toBe(false);
      expect(config.closeOnEscape).toBe(true);
      expect(config.baseZIndex).toBe(10000);
      expect(config.contentStyle).toEqual({
        overflow: 'hidden',
        padding: '0'
      });

      expect(mockDialogRef.onClose.subscribe).toHaveBeenCalled();

      const subscribeCall = (mockDialogRef.onClose.subscribe as jest.Mock).mock.calls[0][0];
      subscribeCall();
      
      promise.then(() => {
        done();
      });
    });

    it('deve abrir o modal de PDF apenas com URL (sem título)', (done) => {
      const url = 'https://example.com/documento.pdf';

      const promise = service.openPdf(url);

      const callArgs = mockDialogService.open.mock.calls[0];
      expect(callArgs[0]).toBe(PdfViewerModalComponent);
      const config = callArgs[1] as any;
      expect(config.data.url).toBe(url);
      expect(config.data.title).toBeUndefined();

      const subscribeCall = (mockDialogRef.onClose.subscribe as jest.Mock).mock.calls[0][0];
      subscribeCall();
      
      promise.then(() => {
        done();
      });
    });

    it('deve usar LayoutUtils.getWidth() para definir a largura do modal', () => {
      const url = 'https://example.com/documento.pdf';
      const getWidthSpy = jest.spyOn(LayoutUtils, 'getWidth').mockReturnValue('50vw');

      service.openPdf(url);

      expect(getWidthSpy).toHaveBeenCalled();
      const callArgs = mockDialogService.open.mock.calls[0];
      expect(callArgs[1].width).toBe('50vw');

      getWidthSpy.mockRestore();
    });

    it('deve retornar uma Promise que resolve quando o modal é fechado', (done) => {
      const url = 'https://example.com/documento.pdf';
      
      const promise = service.openPdf(url);

      expect(promise).toBeInstanceOf(Promise);

      const subscribeCall = (mockDialogRef.onClose.subscribe as jest.Mock).mock.calls[0][0];
      subscribeCall();

      promise.then(() => {
        done();
      });
    });

    it('deve configurar o modal com as propriedades corretas', () => {
      const url = 'https://example.com/documento.pdf';

      service.openPdf(url);

      const callArgs = mockDialogService.open.mock.calls[0];
      const config = callArgs[1];
      expect(config.showHeader).toBe(false);
      expect(config.modal).toBe(true);
      expect(config.closable).toBe(false);
      expect(config.closeOnEscape).toBe(true);
      expect(config.baseZIndex).toBe(10000);
      expect(config.contentStyle).toEqual({
        overflow: 'hidden',
        padding: '0'
      });
    });
  });
});

