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
import { ClientManagementService, FilterClientRequestDto, ClientResponseDto } from '../client-management.service';
import { Client, DefaultStatus, Role } from '@app/model/client';
import { PaginationResponseDto } from '@app/model/dto/response/pagination-response.dto';
import { ResponseDTO } from '@app/model/dto/response.dto';
import { CLIENT_MANAGEMENT_REPOSITORY_TOKEN } from '@app/core/tokens/injection-tokens';
import { IClientManagementRepository } from '@app/core/interfaces/services/repository/client-management-repository.interface';
import { of, throwError } from 'rxjs';
import { ClientManagementRepositoryImpl } from '@app/core/service/repository/client-management-repository.impl';

describe('ClientManagementService', () => {
  let service: ClientManagementService;
  let httpMock: HttpTestingController;
  let mockRepository: jest.Mocked<IClientManagementRepository>;

  const mockClientDto1: ClientResponseDto = {
    id: '1',
    businessName: 'Test Business 1',
    industry: 'Technology',
    status: DefaultStatus.ACTIVE,
    contact: { email: 'test1@test.com' },
    role: Role.CLIENT,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z'
  };

  const mockClientDto2: ClientResponseDto = {
    id: '2',
    businessName: 'Test Business 2',
    industry: 'Retail',
    status: DefaultStatus.INACTIVE,
    contact: { email: 'test2@test.com' },
    role: Role.CLIENT,
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-04T00:00:00Z'
  };

  const mockClient1: Client = {
    id: '1',
    businessName: 'Test Business 1',
    industry: 'Technology',
    status: DefaultStatus.ACTIVE,
    contact: { email: 'test1@test.com' },
    role: Role.CLIENT,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z'
  } as Client;

  const mockClient2: Client = {
    id: '2',
    businessName: 'Test Business 2',
    industry: 'Retail',
    status: DefaultStatus.INACTIVE,
    contact: { email: 'test2@test.com' },
    role: Role.CLIENT,
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-04T00:00:00Z'
  } as Client;

  beforeEach(() => {
    mockRepository = {
      findWithPagination: jest.fn(),
      makePartner: jest.fn()
    } as any;

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ClientManagementService,
        { provide: CLIENT_MANAGEMENT_REPOSITORY_TOKEN, useValue: mockRepository }
      ],
    });

    service = TestBed.inject(ClientManagementService);
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
  });

  describe('getClientsWithPagination', () => {
    it('deve buscar clientes com paginação sem filtros', (done) => {
      const mockPaginationResponse: PaginationResponseDto<Client> = {
        list: [mockClient1, mockClient2],
        totalElements: 2,
        totalPages: 1,
        currentPage: 0,
        size: 10,
        hasNext: false,
        hasPrevious: false
      };

      mockRepository.findWithPagination.mockReturnValue(of(mockPaginationResponse));

      service.getClientsWithPagination().subscribe((response) => {
        expect(response.list.length).toBe(2);
        expect(response.list[0].id).toBe('1');
        expect(response.list[0].businessName).toBe('Test Business 1');
        expect(response.list[1].id).toBe('2');
        expect(response.list[1].businessName).toBe('Test Business 2');
        expect(response.totalElements).toBe(2);
        expect(response.totalPages).toBe(1);
        expect(response.currentPage).toBe(0);
        expect(response.size).toBe(10);
        expect(response.hasNext).toBe(false);
        expect(response.hasPrevious).toBe(false);
        expect(mockRepository.findWithPagination).toHaveBeenCalledWith(undefined);
        done();
      });
    });

    it('deve buscar clientes com paginação e filtros completos', (done) => {
      const filters: FilterClientRequestDto = {
        page: 1,
        size: 5,
        sortBy: 'businessName',
        sortDir: 'asc',
        genericFilter: 'test'
      };

      const mockPaginationResponse: PaginationResponseDto<Client> = {
        list: [mockClient1],
        totalElements: 1,
        totalPages: 1,
        currentPage: 1,
        size: 5,
        hasNext: false,
        hasPrevious: true
      };

      mockRepository.findWithPagination.mockReturnValue(of(mockPaginationResponse));

      service.getClientsWithPagination(filters).subscribe((response) => {
        expect(response.list.length).toBe(1);
        expect(response.totalElements).toBe(1);
        expect(response.currentPage).toBe(1);
        expect(response.size).toBe(5);
        expect(mockRepository.findWithPagination).toHaveBeenCalledWith(filters);
        done();
      });
    });

    it('deve buscar clientes com apenas alguns filtros', (done) => {
      const filters: FilterClientRequestDto = {
        page: 2,
        size: 20
      };

      const mockPaginationResponse: PaginationResponseDto<Client> = {
        list: [mockClient1, mockClient2],
        totalElements: 2,
        totalPages: 1,
        currentPage: 2,
        size: 20,
        hasNext: false,
        hasPrevious: true
      };

      mockRepository.findWithPagination.mockReturnValue(of(mockPaginationResponse));

      service.getClientsWithPagination(filters).subscribe((response) => {
        expect(response.list.length).toBe(2);
        expect(response.currentPage).toBe(2);
        expect(response.size).toBe(20);
        expect(mockRepository.findWithPagination).toHaveBeenCalledWith(filters);
        done();
      });
    });

    it('deve mapear corretamente ClientResponseDto para Client', (done) => {
      const mockPaginationResponse: PaginationResponseDto<Client> = {
        list: [mockClient1],
        totalElements: 1,
        totalPages: 1,
        currentPage: 0,
        size: 10,
        hasNext: false,
        hasPrevious: false
      };

      mockRepository.findWithPagination.mockReturnValue(of(mockPaginationResponse));

      service.getClientsWithPagination().subscribe((response) => {
        const client = response.list[0];
        expect(client.id).toBe(mockClient1.id);
        expect(client.businessName).toBe(mockClient1.businessName);
        expect(client.industry).toBe(mockClient1.industry);
        expect(client.status).toBe(mockClient1.status);
        expect(client.contact?.email).toBe(mockClient1.contact?.email);
        expect(client.role).toBe(mockClient1.role);
        expect(client.createdAt).toBe(mockClient1.createdAt);
        expect(client.updatedAt).toBe(mockClient1.updatedAt);
        done();
      });
    });

    it('deve retornar lista vazia quando repository retorna lista vazia', (done) => {
      const mockPaginationResponse: PaginationResponseDto<Client> = {
        list: [],
        totalElements: 0,
        totalPages: 0,
        currentPage: 0,
        size: 0,
        hasNext: false,
        hasPrevious: false
      };

      mockRepository.findWithPagination.mockReturnValue(of(mockPaginationResponse));

      service.getClientsWithPagination().subscribe((response) => {
        expect(response.list).toEqual([]);
        expect(response.totalElements).toBe(0);
        expect(response.totalPages).toBe(0);
        expect(response.currentPage).toBe(0);
        expect(response.size).toBe(0);
        expect(response.hasNext).toBe(false);
        expect(response.hasPrevious).toBe(false);
        done();
      });
    });

    it('deve usar totalElements quando maior que 0, caso contrário usar length da lista', (done) => {
      const mockPaginationResponse: PaginationResponseDto<Client> = {
        list: [mockClient1, mockClient2],
        totalElements: 10,
        totalPages: 1,
        currentPage: 0,
        size: 10,
        hasNext: false,
        hasPrevious: false
      };

      mockRepository.findWithPagination.mockReturnValue(of(mockPaginationResponse));

      service.getClientsWithPagination().subscribe((response) => {
        expect(response.totalElements).toBe(10);
        done();
      });
    });

    it('deve retornar resposta do repository mesmo quando totalElements é 0', (done) => {
      const mockPaginationResponse: PaginationResponseDto<Client> = {
        list: [mockClient1, mockClient2],
        totalElements: 0,
        totalPages: 1,
        currentPage: 0,
        size: 10,
        hasNext: false,
        hasPrevious: false
      };

      mockRepository.findWithPagination.mockReturnValue(of(mockPaginationResponse));

      service.getClientsWithPagination().subscribe((response) => {
        expect(response.list.length).toBe(2);
        expect(response.totalElements).toBe(0);
        expect(mockRepository.findWithPagination).toHaveBeenCalled();
        done();
      });
    });
  });

  describe('makePartner', () => {
    it('deve fazer cliente virar parceiro', (done) => {
      const clientId = 'client-123';

      mockRepository.makePartner.mockReturnValue(of(undefined));

      service.makePartner(clientId).subscribe(() => {
        expect(mockRepository.makePartner).toHaveBeenCalledWith(clientId);
        done();
      });
    });

    it('deve chamar repository com ID correto', (done) => {
      const clientId = 'test-client-id-456';

      mockRepository.makePartner.mockReturnValue(of(undefined));

      service.makePartner(clientId).subscribe(() => {
        expect(mockRepository.makePartner).toHaveBeenCalledWith(clientId);
        expect(mockRepository.makePartner).toHaveBeenCalledTimes(1);
        done();
      });
    });

    it('deve propagar erro do repository', (done) => {
      const clientId = 'client-123';
      const error = new Error('Repository error');

      mockRepository.makePartner.mockReturnValue(throwError(() => error));

      service.makePartner(clientId).subscribe({
        next: () => fail('deveria ter lançado erro'),
        error: (err) => {
          expect(err).toEqual(error);
          expect(mockRepository.makePartner).toHaveBeenCalledWith(clientId);
          done();
        }
      });
    });
  });
});

