jest.mock('src/environments/environment', () => ({
  environment: {
    production: false,
    apiUrl: 'http://localhost:8080/api/',
  }
}));

jest.mock('ng2-pdf-viewer', () => ({
  PdfViewerModule: {}
}));

import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { LayoutUtils } from '../../../utils/layout.utils';
import { PdfViewerData } from '../../../services/pdf-viewer.service';

class PdfViewerModalComponent {
  data: PdfViewerData;
  pdfSrc: string = '';
  title: string = '';
  ref: DynamicDialogRef;
  config: DynamicDialogConfig;

  constructor(
    ref: DynamicDialogRef,
    config: DynamicDialogConfig
  ) {
    this.ref = ref;
    this.config = config;
    this.data = config.data;
    this.pdfSrc = this.data.url;
    this.title = this.data.title || 'Visualizar PDF';
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

  onResize(): void {
    this.config.width = LayoutUtils.getWidth();
  }

  close(): void {
    this.ref.close();
  }

  onError(error: any): void {
    console.error('Erro ao carregar PDF:', error);
  }
}

describe('PdfViewerModalComponent', () => {
  let component: PdfViewerModalComponent;
  let mockDialogRef: jest.Mocked<DynamicDialogRef>;
  let mockDialogConfig: jest.Mocked<DynamicDialogConfig>;

  const mockPdfViewerData: PdfViewerData = {
    url: 'https://example.com/documento.pdf',
    title: 'Documento Teste'
  };

  beforeEach(() => {
    mockDialogRef = {
      close: jest.fn()
    } as any;

    mockDialogConfig = {
      data: mockPdfViewerData,
      width: '50vw',
      showHeader: false,
      modal: true,
      closable: false,
      closeOnEscape: true,
      baseZIndex: 10000
    } as any;

    component = new PdfViewerModalComponent(mockDialogRef, mockDialogConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
    document.body.style.overflow = '';
  });

  describe('Initialization', () => {
    it('deve ser criado', () => {
      expect(component).toBeTruthy();
    });

    it('deve inicializar com dados do config', () => {
      expect(component.data).toEqual(mockPdfViewerData);
      expect(component.pdfSrc).toBe(mockPdfViewerData.url);
      expect(component.title).toBe(mockPdfViewerData.title);
    });

    it('deve usar título padrão quando não fornecido', () => {
      const configSemTitulo = {
        ...mockDialogConfig,
        data: { url: 'https://example.com/documento.pdf' }
      };
      
      const componentSemTitulo = new PdfViewerModalComponent(mockDialogRef, configSemTitulo);

      expect(componentSemTitulo.title).toBe('Visualizar PDF');
    });

    it('deve chamar onResize no ngOnInit', () => {
      const onResizeSpy = jest.spyOn(component, 'onResize');
      component.ngOnInit();
      expect(onResizeSpy).toHaveBeenCalled();
    });

    it('deve configurar overflow do body quando não há sidebar-carrinho', () => {
      document.body.style.overflow = 'auto';
      const querySelectorSpy = jest.spyOn(document, 'querySelector').mockReturnValue(null);
      
      component.ngOnInit();
      
      expect(document.body.style.overflow).toBe('hidden');
      querySelectorSpy.mockRestore();
    });

    it('não deve alterar overflow do body quando há sidebar-carrinho', () => {
      document.body.style.overflow = 'auto';
      const mockSidebar = document.createElement('div');
      mockSidebar.className = 'sidebar-carrinho';
      const querySelectorSpy = jest.spyOn(document, 'querySelector').mockReturnValue(mockSidebar);
      
      component.ngOnInit();
      
      expect(document.body.style.overflow).toBe('auto');
      querySelectorSpy.mockRestore();
    });
  });

  describe('close', () => {
    it('deve fechar o modal ao chamar close()', () => {
      component.close();
      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });

  describe('onResize', () => {
    it('deve atualizar a largura do config usando LayoutUtils', () => {
      const getWidthSpy = jest.spyOn(LayoutUtils, 'getWidth').mockReturnValue('60vw');
      
      component.onResize();
      
      expect(getWidthSpy).toHaveBeenCalled();
      expect(component.config.width).toBe('60vw');
      
      getWidthSpy.mockRestore();
    });
  });

  describe('onError', () => {
    it('deve logar erro no console quando ocorre erro ao carregar PDF', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Erro ao carregar PDF');
      
      component.onError(error);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Erro ao carregar PDF:', error);
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('ngOnDestroy', () => {
    it('deve restaurar overflow do body quando não há sidebar-carrinho', () => {
      document.body.style.overflow = 'hidden';
      const querySelectorSpy = jest.spyOn(document, 'querySelector').mockReturnValue(null);
      
      component.ngOnDestroy();
      
      expect(document.body.style.overflow).toBe('auto');
      querySelectorSpy.mockRestore();
    });

    it('não deve alterar overflow do body quando há sidebar-carrinho', () => {
      document.body.style.overflow = 'hidden';
      const mockSidebar = document.createElement('div');
      mockSidebar.className = 'sidebar-carrinho';
      const querySelectorSpy = jest.spyOn(document, 'querySelector').mockReturnValue(mockSidebar);
      
      component.ngOnDestroy();
      
      expect(document.body.style.overflow).toBe('hidden');
      querySelectorSpy.mockRestore();
    });
  });

  describe('Data Properties', () => {
    it('deve ter a URL correta no pdfSrc', () => {
      expect(component.pdfSrc).toBe(mockPdfViewerData.url);
    });

    it('deve ter o título correto quando fornecido', () => {
      expect(component.title).toBe(mockPdfViewerData.title);
    });
  });

  describe('Resize Handling', () => {
    it('deve atualizar a largura do config quando onResize é chamado', () => {
      const getWidthSpy = jest.spyOn(LayoutUtils, 'getWidth').mockReturnValue('50vw');
      
      component.onResize();
      
      expect(getWidthSpy).toHaveBeenCalled();
      expect(component.config.width).toBe('50vw');
      
      getWidthSpy.mockRestore();
    });
  });
});

