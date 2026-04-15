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
import { IClientRepository } from '@app/core/interfaces/services/repository/client-repository.interface';
import { ClientDomainService } from '@app/core/service/domain/client.domain.service';
import { CLIENT_REPOSITORY_TOKEN } from '@app/core/tokens/injection-tokens';
import { Client } from '@app/model/client';
import { Page } from '@app/model/dto/page.dto';
import { ClientAdRequestDto } from '@app/model/dto/request/client-ad-request.dto';
import { ClientRequestDTO } from '@app/model/dto/request/client-request.dto';
import { RefusedAdRequestDto } from '@app/model/dto/request/refused-ad-request.dto';
import { SenhaRequestDto } from '@app/model/dto/request/senha-request.dto';
import { AdRequestResponseDto, PendingAdAdminValidationResponseDto } from '@app/model/dto/response/ad-request-response.dto';
import { AdResponseDto } from '@app/model/dto/response/ad-response.dto';
import { AuthenticatedClientResponseDto } from '@app/model/dto/response/authenticated-client-response.dto';
import { ClientResponseDTO } from '@app/model/dto/response/client-response.dto';
import { PaginationResponseDto } from '@app/model/dto/response/pagination-response.dto';
import { WishlistResponseDto } from '@app/model/dto/response/wishlist-response.dto';
import { of, throwError } from 'rxjs';
import { ClientService } from '../client.service';

describe('ClientService', () => {
  let service: ClientService;
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
    hasAdRequest: false,
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
      getClientAttachments: jest.fn(),
      saveWithLoadingOption: jest.fn(),
      editar: jest.fn(),
      criarSenha: jest.fn(),
      atualizardadosPerfil: jest.fn(),
      reenvioCodigo: jest.fn(),
      validarCodigo: jest.fn(),
      aceitarTermosDeCondicao: jest.fn(),
      clientExistente: jest.fn(),
      buscarClient: jest.fn(),
      buscaClientPorIdentificador: jest.fn(),
      getAllAds: jest.fn(),
      getAllAdRequests: jest.fn(),
      getPendingAds: jest.fn(),
      uploadAttachment: jest.fn(),
      uploadMultipleAttachments: jest.fn(),
      createAdRequest: jest.fn(),
      validateAd: jest.fn(),
      addToWishlist: jest.fn(),
      getWishlist: jest.fn(),
      findWithPagination: jest.fn(),
    } as any;

    mockDomainService = {
      createClient: jest.fn(),
      updateClient: jest.fn(),
      validateClientData: jest.fn()
    } as any;

    TestBed.configureTestingModule({
      providers: [
        ClientService,
        { provide: CLIENT_REPOSITORY_TOKEN, useValue: mockRepository },
        { provide: ClientDomainService, useValue: mockDomainService }
      ],
    });

    service = TestBed.inject(ClientService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('deve ser criado', () => {
      expect(service).toBeTruthy();
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

      mockRepository.saveWithLoadingOption.mockReturnValue(of({}));

      service.save(clientRequest).subscribe(() => {
        expect(mockRepository.saveWithLoadingOption).toHaveBeenCalledWith(clientRequest, false);
        done();
      });
    });

    it('deve salvar cliente ignorando loading quando solicitado', (done) => {
      const clientRequest: ClientRequestDTO = {
        businessName: 'Test Business',
        contact: { email: 'test@test.com', phone: '1234567890' },
        addresses: []
      };

      mockRepository.saveWithLoadingOption.mockReturnValue(of({}));

      service.save(clientRequest, true).subscribe(() => {
        expect(mockRepository.saveWithLoadingOption).toHaveBeenCalledWith(clientRequest, true);
        done();
      });
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

      mockRepository.editar.mockReturnValue(of({}));

      service.editar(id, clientRequest).subscribe(() => {
        expect(mockRepository.editar).toHaveBeenCalledWith(id, clientRequest);
        done();
      });
    });
  });

  describe('criarSenha', () => {
    it('deve criar senha para login', (done) => {
      const login = 'test@test.com';
      const senhaRequest = new SenhaRequestDto('newPassword123', 'newPassword123');

      mockRepository.criarSenha.mockReturnValue(of({}));

      service.criarSenha(login, senhaRequest).subscribe(() => {
        expect(mockRepository.criarSenha).toHaveBeenCalledWith(login, senhaRequest);
        done();
      });
    });
  });

  describe('atualizardadosPerfil', () => {
    it('deve atualizar dados do perfil', (done) => {
      const id = '123';
      const clientRequest: ClientRequestDTO = {
        businessName: 'Updated Profile',
        contact: { email: 'profile@test.com', phone: '1112223333' },
        addresses: []
      };

      mockRepository.atualizardadosPerfil.mockReturnValue(of({}));

      service.atualizardadosPerfil(id, clientRequest).subscribe(() => {
        expect(mockRepository.atualizardadosPerfil).toHaveBeenCalledWith(id, clientRequest);
        done();
      });
    });
  });

  describe('reenvioCodigo', () => {
    it('deve reenviar código para login', (done) => {
      const login = 'test@test.com';

      mockRepository.reenvioCodigo.mockReturnValue(of({}));

      service.reenvioCodigo(login).subscribe(() => {
        expect(mockRepository.reenvioCodigo).toHaveBeenCalledWith(login);
        done();
      });
    });
  });

  describe('validarCodigo', () => {
    it('deve validar código com parâmetros corretos', (done) => {
      const login = 'test@test.com';
      const code = '123456';

      mockRepository.validarCodigo.mockReturnValue(of({}));

      service.validarCodigo(login, code).subscribe(() => {
        expect(mockRepository.validarCodigo).toHaveBeenCalledWith(login, code);
        done();
      });
    });
  });

  describe('aceitarTermosDeCondicao', () => {
    it('deve aceitar termos de condição', (done) => {
      mockRepository.aceitarTermosDeCondicao.mockReturnValue(of({}));

      service.aceitarTermosDeCondicao().subscribe(() => {
        expect(mockRepository.aceitarTermosDeCondicao).toHaveBeenCalledTimes(1);
        done();
      });
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

      mockRepository.clientExistente.mockReturnValue(of(mockResponse));

      service.clientExistente(email).subscribe((response) => {
        expect(response).toEqual(mockResponse);
        expect(mockRepository.clientExistente).toHaveBeenCalledWith(email);
        done();
      });
    });
  });

  describe('buscarClient', () => {
    it('deve buscar cliente por ID/UUID', (done) => {
      const id = '123';
      const mockResponse: Client = {
        id: '123',
        businessName: 'Test Business'
      } as Client;

      mockRepository.buscarClient.mockReturnValue(of(mockResponse));

      service.buscarClient<Client>(id).subscribe((response) => {
        expect(response).toEqual(mockResponse);
        expect(mockRepository.buscarClient).toHaveBeenCalledWith(id);
        done();
      });
    });

    it('deve lançar erro quando ID não fornecido', (done) => {
      const error = new Error('ID/UUID não fornecido');
      mockRepository.buscarClient.mockImplementation(() => {
        throw error;
      });

      try {
        service.buscarClient('');
        fail('deveria ter lançado erro');
      } catch (err: any) {
        expect(err.message).toBe('ID/UUID não fornecido');
        done();
      }
    });

    it('deve lançar erro quando resposta inválida', (done) => {
      const id = '123';
      const error = new Error('Dados do usuário não encontrados');
      mockRepository.buscarClient.mockReturnValue(throwError(() => error));

      service.buscarClient<Client>(id).subscribe({
        next: () => fail('deveria ter lançado erro'),
        error: (err) => {
          expect(err.message).toBe('Dados do usuário não encontrados');
          done();
        }
      });
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

      mockRepository.buscaClientPorIdentificador.mockReturnValue(of(mockResponse));

      service.buscaClientPorIdentificador(email).subscribe((response) => {
        expect(response).toEqual(mockResponse);
        expect(mockRepository.buscaClientPorIdentificador).toHaveBeenCalledWith(email);
        done();
      });
    });

    it('deve lançar erro quando email não fornecido', (done) => {
      const error = new Error('Email not provided');
      mockRepository.buscaClientPorIdentificador.mockImplementation(() => {
        throw error;
      });

      try {
        service.buscaClientPorIdentificador('');
        fail('deveria ter lançado erro');
      } catch (err: any) {
        expect(err.message).toBe('Email not provided');
        done();
      }
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

      mockRepository.getAllAds.mockReturnValue(of(mockPage));

      service.getAllAds().subscribe((response) => {
        expect(response).toEqual(mockPage);
        expect(mockRepository.getAllAds).toHaveBeenCalledWith(1, 10);
        done();
      });
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

      mockRepository.getAllAds.mockReturnValue(of(mockPage));

      service.getAllAds(page, size).subscribe((response) => {
        expect(response).toEqual(mockPage);
        expect(mockRepository.getAllAds).toHaveBeenCalledWith(page, size);
        done();
      });
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

      mockRepository.getAllAdRequests.mockReturnValue(of(mockResponse));

      service.getAllAdRequests().subscribe((response) => {
        expect(response).toEqual(mockResponse);
        expect(mockRepository.getAllAdRequests).toHaveBeenCalledWith(undefined);
        done();
      });
    });

    it('deve buscar ad requests com filtros', (done) => {
      const filters = {
        page: 1,
        size: 10,
        sortBy: 'createdAt',
        sortDir: 'desc',
        genericFilter: 'test'
      };

      mockRepository.getAllAdRequests.mockReturnValue(of({
        list: [],
        totalElements: 0,
        totalPages: 0,
        currentPage: 0,
        size: 0,
        hasNext: false,
        hasPrevious: false
      }));

      service.getAllAdRequests(filters).subscribe(() => {
        expect(mockRepository.getAllAdRequests).toHaveBeenCalledWith(filters);
        done();
      });
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

      mockRepository.getPendingAds.mockReturnValue(of(mockResponse));

      service.getPendingAds().subscribe((response) => {
        expect(response).toEqual(mockResponse);
        expect(mockRepository.getPendingAds).toHaveBeenCalledWith(undefined);
        done();
      });
    });
  });

  describe('uploadAttachment', () => {
    it('deve fazer upload de attachment sem ID', (done) => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });

      mockRepository.uploadAttachment.mockReturnValue(of({}));

      service.uploadAttachment(file).subscribe(() => {
        expect(mockRepository.uploadAttachment).toHaveBeenCalledWith(file, undefined);
        done();
      });
    });

    it('deve fazer upload de attachment com ID', (done) => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const id = 'attachment-123';

      mockRepository.uploadAttachment.mockReturnValue(of({}));

      service.uploadAttachment(file, id).subscribe(() => {
        expect(mockRepository.uploadAttachment).toHaveBeenCalledWith(file, id);
        done();
      });
    });
  });

  describe('uploadMultipleAttachments', () => {
    it('deve fazer upload de múltiplos attachments', (done) => {
      const files = [
        new File(['content1'], 'test1.txt', { type: 'text/plain' }),
        new File(['content2'], 'test2.txt', { type: 'text/plain' })
      ];

      mockRepository.uploadMultipleAttachments.mockReturnValue(of({}));

      service.uploadMultipleAttachments(files).subscribe(() => {
        expect(mockRepository.uploadMultipleAttachments).toHaveBeenCalledWith(files);
        done();
      });
    });
  });

  describe('createAdRequest', () => {
    it('deve criar ad request', (done) => {
      const adRequest: ClientAdRequestDto = {
        attachmentIds: ['1', '2'],
      };

      mockRepository.createAdRequest.mockReturnValue(of({}));

      service.createAdRequest(adRequest).subscribe(() => {
        expect(mockRepository.createAdRequest).toHaveBeenCalledWith(adRequest);
        done();
      });
    });
  });

  describe('validateAd', () => {
    it('deve validar ad como APPROVED', (done) => {
      const adId = '123';
      const validation = 'APPROVED';

      mockRepository.validateAd.mockReturnValue(of({}));

      service.validateAd(adId, validation).subscribe(() => {
        expect(mockRepository.validateAd).toHaveBeenCalledWith(adId, validation, undefined);
        done();
      });
    });

    it('deve validar ad como REJECTED com refusedData', (done) => {
      const adId = '123';
      const validation = 'REJECTED';
      const refusedData: RefusedAdRequestDto = {
        justification: 'Not appropriate',
        description: 'Content does not meet standards'
      };

      mockRepository.validateAd.mockReturnValue(of({}));

      service.validateAd(adId, validation, refusedData).subscribe(() => {
        expect(mockRepository.validateAd).toHaveBeenCalledWith(adId, validation, refusedData);
        done();
      });
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
      
      mockRepository.addToWishlist.mockReturnValue(of(true));

      service.addToWishlist(monitorId).subscribe((result) => {
        expect(result).toBe(true);
        expect(mockRepository.addToWishlist).toHaveBeenCalledWith(monitorId);
        done();
      });
    });

    it('deve retornar false em caso de erro', (done) => {
      const monitorId = 'monitor-123';

      mockRepository.addToWishlist.mockReturnValue(of(false));

      service.addToWishlist(monitorId).subscribe((result) => {
        expect(result).toBe(false);
        done();
      });
    });
  });

  describe('getWishlist', () => {
    it('deve buscar wishlist', (done) => {
      const mockWishlist: WishlistResponseDto = {
        id: 'wishlist-1',
        monitors: []
      };

      mockRepository.getWishlist.mockReturnValue(of(mockWishlist));

      service.getWishlist().subscribe((response) => {
        expect(response.id).toBe('wishlist-1');
        expect(response.monitors).toEqual([]);
        expect(mockRepository.getWishlist).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });
});
