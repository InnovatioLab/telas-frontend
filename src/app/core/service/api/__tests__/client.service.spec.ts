jest.mock('src/environments/environment', () => ({
  environment: {
    production: false,
    apiUrl: 'http://localhost:8080/api/',
    zipCodeApiKey: 'mock-zip-code-api-key',
    googleMapsApiKey: 'mock-google-maps-api-key',
    stripePublicKey: 'mock-stripe-public-key',
    stripePrivateKey: 'mock-stripe-private-key',
  }
}));

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpParams } from '@angular/common/http';
import { ClientService } from '../client.service';
import { CLIENT_REPOSITORY_TOKEN } from '@app/core/tokens/injection-tokens';
import { IClientRepository } from '@app/core/interfaces/services/repository/client-repository.interface';
import { ClientDomainService } from '@app/core/service/domain/client.domain.service';
import { ClientRequestDTO } from '@app/model/dto/request/client-request.dto';
import { ClientResponseDTO } from '@app/model/dto/response/client-response.dto';
import { AuthenticatedClientResponseDto } from '@app/model/dto/response/authenticated-client-response.dto';
import { ResponseDTO } from '@app/model/dto/response.dto';
import { ClientAdRequestDto } from '@app/model/dto/request/client-ad-request.dto';
import { RefusedAdRequestDto } from '@app/model/dto/request/refused-ad-request.dto';
import { SenhaRequestDto } from '@app/model/dto/request/senha-request.dto';
import { Client } from '@app/model/client';
import { WishlistResponseDto } from '@app/model/dto/response/wishlist-response.dto';
import { Page } from '@app/model/dto/page.dto';
import { AdResponseDto } from '@app/model/dto/response/ad-response.dto';
import { PaginationResponseDto } from '@app/model/dto/response/pagination-response.dto';
import { AdRequestResponseDto, PendingAdAdminValidationResponseDto } from '@app/model/dto/response/ad-request-response.dto';
import { of, throwError } from 'rxjs';
import { take } from 'rxjs/operators';

describe('ClientService', () => {
  let service: ClientService;
  let httpMock: HttpTestingController;
  let mockRepository: jest.Mocked<IClientRepository>;
  let mockDomainService: jest.Mocked<ClientDomainService>;

  const mockClient: Client = {
    id: '1',
    businessName: 'Test Business',
    contact: { email: 'test@test.com', phone: '1234567890' },
    role: 'CLIENT',
    termAccepted: true
  } as Client;

  const mockAuthenticatedClient: AuthenticatedClientResponseDto = {
    id: '1',
    businessName: 'Test Business',
    role: 'CLIENT',
    status: 'ACTIVE',
    contact: { id: 'c1', email: 'test@test.com', phone: '1234567890' },
    socialMedia: null,
    adRequest: null,
    addresses: [],
    attachments: [],
    ads: [],
    termAccepted: true,
    currentSubscriptionFlowStep: 0,
    hasSubscription: false,
    shouldDisplayAttachments: false,
  };

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('telas_token', 'test-token');

    mockRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      getAuthenticatedClient: jest.fn(),
      getClientAds: jest.fn(),
      getClientAttachments: jest.fn()
    } as any;

    mockDomainService = {
      createClient: jest.fn(),
      updateClient: jest.fn(),
      validateClientData: jest.fn()
    } as any;

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ClientService,
        { provide: CLIENT_REPOSITORY_TOKEN, useValue: mockRepository },
        { provide: ClientDomainService, useValue: mockDomainService }
      ],
    });

    service = TestBed.inject(ClientService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('deve ser criado', () => {
      expect(service).toBeTruthy();
    });

    it('deve ter URL configurada corretamente', () => {
      expect(service.url).toContain('clients');
    });

    it('deve ter BehaviorSubject clientAtual$', () => {
      expect(service.clientAtual$).toBeDefined();
      expect(service.clientAtual$.getValue()).toBeNull();
    });

    it('deve ter Subject cancelarEdicao$', () => {
      expect(service.cancelarEdicao$).toBeDefined();
    });
  });

  describe('save', () => {
    it('deve salvar cliente sem ignorar loading', (done) => {
      const clientRequest: ClientRequestDTO = {
        businessName: 'Test Business',
        contact: { email: 'test@test.com', phone: '1234567890' },
        addresses: []
      };

      service.save(clientRequest).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes('clients') && req.method === 'POST');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(clientRequest);
      expect(req.request.headers.has('Ignorar-Loading-Interceptor')).toBeFalsy();
      req.flush({});
    });

    it('deve salvar cliente ignorando loading quando solicitado', (done) => {
      const clientRequest: ClientRequestDTO = {
        businessName: 'Test Business',
        contact: { email: 'test@test.com', phone: '1234567890' },
        addresses: []
      };

      service.save(clientRequest, true).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes('clients') && req.method === 'POST');
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('Ignorar-Loading-Interceptor')).toBe('true');
      req.flush({});
    });
  });

  describe('editar', () => {
    it('deve editar cliente com ID', (done) => {
      const id = '123';
      const clientRequest: ClientRequestDTO = {
        businessName: 'Updated Business',
        contact: { email: 'updated@test.com', phone: '9876543210' },
        addresses: []
      };

      service.editar(id, clientRequest).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes(`clients/${id}`) && req.method === 'PUT');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(clientRequest);
      req.flush({});
    });
  });

  describe('criarSenha', () => {
    it('deve criar senha para login', (done) => {
      const login = 'test@test.com';
      const senhaRequest = new SenhaRequestDto('newPassword123', 'newPassword123');

      service.criarSenha(login, senhaRequest).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes(`create-password/${login}`));
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(senhaRequest);
      req.flush({});
    });
  });

  describe('atualizardadosPerfil', () => {
    it('deve atualizar dados do perfil com headers de autorização', (done) => {
      const id = '123';
      const clientRequest: ClientRequestDTO = {
        businessName: 'Updated Profile',
        contact: { email: 'profile@test.com', phone: '1112223333' },
        addresses: []
      };

      service.atualizardadosPerfil(id, clientRequest).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes(`clients/${id}`) && req.method === 'PUT');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(clientRequest);
      expect(req.request.headers.has('Authorization')).toBeTruthy();
      req.flush({});
    });
  });

  describe('reenvioCodigo', () => {
    it('deve reenviar código para login', (done) => {
      const login = 'test@test.com';

      service.reenvioCodigo(login).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes(`resend-code/${login}`));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush({});
    });
  });

  describe('validarCodigo', () => {
    it('deve validar código com parâmetros corretos', (done) => {
      const login = 'test@test.com';
      const code = '123456';

      service.validarCodigo(login, code).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(req => 
        req.url.includes(`validate-code/${login}`) &&
        req.params.get('code') === code
      );
      expect(req.request.method).toBe('PATCH');
      req.flush({});
    });
  });

  describe('aceitarTermosDeCondicao', () => {
    it('deve aceitar termos de condição', (done) => {
      service.aceitarTermosDeCondicao().subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes('accept-terms-conditions'));
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toBeNull();
      expect(req.request.headers.has('Authorization')).toBeTruthy();
      req.flush({});
    });
  });

  describe('clientExistente', () => {
    it('deve buscar cliente existente por email', (done) => {
      const email = 'test@test.com';
      const mockResponse: ClientResponseDTO = {
        id: '1',
        businessName: 'Test Business',
        contact: { email: 'test@test.com' }
      } as ClientResponseDTO;

      service.clientExistente(email).subscribe((response) => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes(`identification/${email}`));
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockResponse });
    });
  });

  describe('buscarClient', () => {
    it('deve buscar cliente por ID/UUID', (done) => {
      const id = '123';
      const mockResponse: Client = {
        id: '123',
        businessName: 'Test Business'
      } as Client;

      service.buscarClient<Client>(id).subscribe((response) => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes(`clients/${id}`));
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockResponse });
    });

    it('deve lançar erro quando ID não fornecido', () => {
      expect(() => {
        service.buscarClient('');
      }).toThrow('ID/UUID não fornecido');
    });

    it('deve lançar erro quando resposta inválida', (done) => {
      const id = '123';

      service.buscarClient<Client>(id).subscribe({
        next: () => fail('deveria ter lançado erro'),
        error: (error) => {
          expect(error.message).toBe('Dados do usuário não encontrados');
          done();
        }
      });

      const req = httpMock.expectOne(req => req.url.includes(`clients/${id}`));
      req.flush({});
    });
  });

  describe('buscaClientPorIdentificador', () => {
    it('deve buscar cliente por email', (done) => {
      const email = 'test@test.com';
      const mockResponse: ClientResponseDTO = {
        id: '1',
        businessName: 'Test Business',
        contact: { email: 'test@test.com' }
      } as ClientResponseDTO;

      service.buscaClientPorIdentificador(email).subscribe((response) => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes(`identification/${email}`));
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockResponse });
    });

    it('deve lançar erro quando email não fornecido', () => {
      expect(() => {
        service.buscaClientPorIdentificador('');
      }).toThrow('Email not provided');
    });
  });

  describe('setClientAtual e getClientAtual', () => {
    it('deve definir e recuperar cliente atual', () => {
      expect(service.getClientAtual()).toBeNull();

      service.setClientAtual(mockClient);
      expect(service.getClientAtual()).toEqual(mockClient);
      
      const stored = localStorage.getItem('telas_token_user');
      if (stored) {
        expect(JSON.parse(stored)).toEqual(mockClient);
      }

      service.setClientAtual(null);
      expect(service.getClientAtual()).toBeNull();
    });

    it('deve emitir valor no BehaviorSubject quando setClientAtual é chamado', (done) => {
      let valueReceived = false;
      service.clientAtual$.subscribe((client) => {
        if (client && !valueReceived) {
          expect(client).toEqual(mockClient);
          valueReceived = true;
          done();
        }
      });

      service.setClientAtual(mockClient);
    });
  });

  describe('getAllAds', () => {
    it('deve buscar todos os ads com paginação padrão', (done) => {
      const mockPage: Page<AdResponseDto> = {
        content: [],
        pageable: {
          pageNumber: 0,
          pageSize: 10,
          sort: { empty: true, sorted: false, unsorted: true },
          offset: 0,
          unpaged: false,
          paged: true
        },
        last: true,
        totalElements: 0,
        totalPages: 0,
        size: 10,
        number: 0,
        sort: { empty: true, sorted: false, unsorted: true },
        first: true,
        numberOfElements: 0,
        empty: true
      };

      service.getAllAds().subscribe((response) => {
        expect(response).toEqual(mockPage);
        done();
      });

      const req = httpMock.expectOne(req => 
        req.url.includes('ads-requests') &&
        req.params.get('page') === '1' &&
        req.params.get('size') === '10'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockPage });
    });

    it('deve buscar todos os ads com paginação customizada', (done) => {
      const page = 2;
      const size = 20;
      const mockPage: Page<AdResponseDto> = {
        content: [],
        pageable: {
          pageNumber: 2,
          pageSize: 20,
          sort: { empty: true, sorted: false, unsorted: true },
          offset: 40,
          unpaged: false,
          paged: true
        },
        last: true,
        totalElements: 0,
        totalPages: 0,
        size: 20,
        number: 2,
        sort: { empty: true, sorted: false, unsorted: true },
        first: false,
        numberOfElements: 0,
        empty: true
      };

      service.getAllAds(page, size).subscribe((response) => {
        expect(response).toEqual(mockPage);
        done();
      });

      const req = httpMock.expectOne(req => 
        req.url.includes('ads-requests') &&
        req.params.get('page') === '2' &&
        req.params.get('size') === '20'
      );
      req.flush({ data: mockPage });
    });
  });

  describe('getAllAdRequests', () => {
    it('deve buscar ad requests sem filtros', (done) => {
      const mockResponse: PaginationResponseDto<AdRequestResponseDto> = {
        list: [] as AdRequestResponseDto[],
        totalElements: 0,
        totalPages: 0,
        currentPage: 0,
        size: 0,
        hasNext: false,
        hasPrevious: false
      };

      service.getAllAdRequests().subscribe((response) => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(req => 
        req.url.includes('ads-requests') &&
        req.params.has('_t')
      );
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockResponse });
    });

    it('deve buscar ad requests com filtros', (done) => {
      const filters = {
        page: 1,
        size: 10,
        sortBy: 'createdAt',
        sortDir: 'desc',
        genericFilter: 'test'
      };

      service.getAllAdRequests(filters).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(req => {
        const url = req.url.includes('ads-requests');
        const params = req.params;
        return url &&
          params.get('page') === '1' &&
          params.get('size') === '10' &&
          params.get('sortBy') === 'createdAt' &&
          params.get('sortDir') === 'desc' &&
          params.get('genericFilter') === 'test' &&
          params.has('_t');
      });
      req.flush({ data: { list: [], totalElements: 0 } });
    });
  });

  describe('getPendingAds', () => {
    it('deve buscar ads pendentes', (done) => {
      const mockResponse: PaginationResponseDto<PendingAdAdminValidationResponseDto> = {
        list: [] as PendingAdAdminValidationResponseDto[],
        totalElements: 0,
        totalPages: 0,
        currentPage: 0,
        size: 0,
        hasNext: false,
        hasPrevious: false
      };

      service.getPendingAds().subscribe((response) => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(req => 
        req.url.includes('pending-ads') &&
        req.params.has('_t')
      );
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockResponse });
    });
  });

  describe('uploadAttachment', () => {
    it('deve fazer upload de attachment sem ID', (done) => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });

      service.uploadAttachment(file).subscribe(() => {
        done();
      });

      setTimeout(() => {
        const req = httpMock.expectOne(req => req.url.includes('/attachments'));
        expect(req.request.method).toBe('POST');
        expect(Array.isArray(req.request.body)).toBe(true);
        expect(req.request.body[0].name).toBe('test.txt');
        expect(req.request.body[0].type).toBe('text/plain');
        expect(req.request.body[0].bytes).toBeDefined();
        expect(req.request.body[0].id).toBeUndefined();
        req.flush({});
      }, 100);
    });

    it('deve fazer upload de attachment com ID', (done) => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const id = 'attachment-123';

      service.uploadAttachment(file, id).subscribe(() => {
        done();
      });

      setTimeout(() => {
        const req = httpMock.expectOne(req => req.url.includes('/attachments'));
        expect(req.request.method).toBe('POST');
        expect(req.request.body[0].id).toBe(id);
        req.flush({});
      }, 100);
    });
  });

  describe('uploadMultipleAttachments', () => {
    it('deve fazer upload de múltiplos attachments', (done) => {
      const files = [
        new File(['content1'], 'test1.txt', { type: 'text/plain' }),
        new File(['content2'], 'test2.txt', { type: 'text/plain' })
      ];

      service.uploadMultipleAttachments(files).subscribe(() => {
        done();
      });

      setTimeout(() => {
        const req = httpMock.expectOne(req => req.url.includes('/attachments'));
        expect(req.request.method).toBe('POST');
        expect(Array.isArray(req.request.body)).toBe(true);
        expect(req.request.body.length).toBe(2);
        req.flush({});
      }, 100);
    });
  });

  describe('createAdRequest', () => {
    it('deve criar ad request', (done) => {
      const adRequest: ClientAdRequestDto = {
        attachmentIds: ['1', '2'],
        message: 'Test message',
        email: 'test@test.com',
        phone: '1234567890'
      };

      service.createAdRequest(adRequest).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes('/request-ad'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(adRequest);
      req.flush({});
    });
  });

  describe('validateAd', () => {
    it('deve validar ad como APPROVED', (done) => {
      const adId = '123';
      const validation = 'APPROVED';

      service.validateAd(adId, validation).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(req => 
        req.url.includes(`/validate-ad/${adId}`) &&
        req.url.includes('validation=APPROVED')
      );
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({});
      req.flush({});
    });

    it('deve validar ad como REJECTED com refusedData', (done) => {
      const adId = '123';
      const validation = 'REJECTED';
      const refusedData: RefusedAdRequestDto = {
        justification: 'Not appropriate',
        description: 'Content does not meet standards'
      };

      service.validateAd(adId, validation, refusedData).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(req => 
        req.url.includes(`/validate-ad/${adId}`) &&
        req.url.includes('validation=REJECTED')
      );
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(refusedData);
      req.flush({});
    });
  });

  describe('getAuthenticatedClient', () => {
    it('deve chamar repository getAuthenticatedClient', (done) => {
      mockRepository.getAuthenticatedClient.mockReturnValue(of(mockAuthenticatedClient));

      service.getAuthenticatedClient().subscribe((response) => {
        expect(response).toEqual(mockAuthenticatedClient);
        expect(mockRepository.getAuthenticatedClient).toHaveBeenCalledTimes(1);
        done();
      });
    });

    it('deve propagar erro do repository', (done) => {
      const error = new Error('Repository error');
      mockRepository.getAuthenticatedClient.mockReturnValue(throwError(() => error));

      service.getAuthenticatedClient().subscribe({
        next: () => fail('deveria ter lançado erro'),
        error: (err) => {
          expect(err).toEqual(error);
          done();
        }
      });
    });
  });

  describe('addToWishlist', () => {
    it('deve adicionar monitor à wishlist', (done) => {
      const monitorId = 'monitor-123';
      
      service.addToWishlist(monitorId).subscribe((result) => {
        expect(result).toBe(true);
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes(`/wishlist/${monitorId}`));
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.has('Authorization')).toBeTruthy();
      req.flush({ success: true });
    });

    it('deve retornar false em caso de erro', (done) => {
      const monitorId = 'monitor-123';

      service.addToWishlist(monitorId).subscribe((result) => {
        expect(result).toBe(false);
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes(`/wishlist/${monitorId}`));
      req.error(new ErrorEvent('Network error'));
    });
  });

  describe('getWishlist', () => {
    it('deve buscar wishlist', (done) => {
      const mockWishlist: WishlistResponseDto = {
        id: 'wishlist-1',
        monitors: []
      };

      service.getWishlist().subscribe((response) => {
        expect(response.id).toBe('wishlist-1');
        expect(response.monitors).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes('/wishlist'));
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.has('Authorization')).toBeTruthy();
      req.flush({ data: mockWishlist });
    });
  });
});
