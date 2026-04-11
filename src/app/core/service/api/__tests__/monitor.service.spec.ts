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

import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { IMonitorRepository } from '@app/core/interfaces/services/repository/monitor-repository.interface';
import { MONITOR_REPOSITORY_TOKEN } from '@app/core/tokens/injection-tokens';
import { ENVIRONMENT } from 'src/environments/environment-token';
import { CreateMonitorRequestDto, UpdateMonitorRequestDto } from '@app/model/dto/request/create-monitor.request.dto';
import { FilterMonitorRequestDto } from '@app/model/dto/request/filter-monitor.request.dto';
import { PaginationResponseDto } from '@app/model/dto/response/pagination-response.dto';
import { Monitor } from '@app/model/monitors';
import { of, throwError } from 'rxjs';
import { MonitorService } from '../monitor.service';

const mockEnvironment = {
  production: false,
  apiUrl: 'http://localhost:8080/api/',
  zipCodeApiKey: 'k',
  googleMapsApiKey: 'k',
  stripePublicKey: 'k',
  stripePrivateKey: 'k',
  nomeToken: 'telas_token',
  nomeTokenRefresh: 'r',
};

describe('MonitorService', () => {
  let service: MonitorService;
  let mockRepository: jest.Mocked<IMonitorRepository>;
  let httpMock: HttpTestingController;

  const mockMonitor: Monitor = {
    id: 'mon-1',
    active: true,
    fullAddress: '123 Test St, City, State 12345',
    address: {
      id: 'addr-1',
      street: '123 Test St',
      city: 'City',
      state: 'State',
      country: 'Country',
      zipCode: '12345'
    },
    adLinks: [],
    canBeDeleted: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockPaginationResponse: PaginationResponseDto<Monitor> = {
    list: [mockMonitor],
    totalElements: 1,
    totalPages: 1,
    currentPage: 0,
    size: 10,
    hasNext: false,
    hasPrevious: false
  };

  const mockCreateRequest: CreateMonitorRequestDto = {
    locationDescription: 'New Location',
    address: {
      street: '456 New St',
      city: 'New City',
      state: 'New State',
      country: 'New Country',
      zipCode: '54321'
    }
  };

  const mockUpdateRequest: UpdateMonitorRequestDto = {
    locationDescription: 'Updated Location',
    active: false
  };

  beforeEach(() => {
    mockRepository = {
      findWithPagination: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findValidAds: jest.fn()
    } as any;

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        MonitorService,
        { provide: MONITOR_REPOSITORY_TOKEN, useValue: mockRepository },
        { provide: ENVIRONMENT, useValue: mockEnvironment },
      ],
    });

    service = TestBed.inject(MonitorService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    jest.clearAllMocks();
    httpMock.verify();
  });

  describe('Initialization', () => {
    it('deve ser criado', () => {
      expect(service).toBeTruthy();
    });
  });

  describe('getMonitorsWithPagination', () => {
    it('deve buscar monitores com paginação sem filtros', (done) => {
      mockRepository.findWithPagination.mockReturnValue(of(mockPaginationResponse));

      service.getMonitorsWithPagination().subscribe((response) => {
        expect(response.list.length).toBe(1);
        expect(response.list[0].id).toBe('mon-1');
        expect(response.totalElements).toBe(1);
        expect(mockRepository.findWithPagination).toHaveBeenCalledTimes(1);
        expect(mockRepository.findWithPagination).toHaveBeenCalledWith(undefined);
        done();
      });
    });

    it('deve buscar monitores com paginação e filtros completos', (done) => {
      const filters: FilterMonitorRequestDto = {
        page: 1,
        size: 5,
        sortBy: 'locationDescription',
        sortDir: 'asc',
        genericFilter: 'Test'
      };

      const filteredResponse: PaginationResponseDto<Monitor> = {
        ...mockPaginationResponse,
        currentPage: 1,
        size: 5
      };

      mockRepository.findWithPagination.mockReturnValue(of(filteredResponse));

      service.getMonitorsWithPagination(filters).subscribe((response) => {
        expect(response.list.length).toBe(1);
        expect(response.currentPage).toBe(1);
        expect(response.size).toBe(5);
        expect(mockRepository.findWithPagination).toHaveBeenCalledTimes(1);
        expect(mockRepository.findWithPagination).toHaveBeenCalledWith(filters);
        done();
      });
    });

    it('deve propagar erro quando repository lança erro', (done) => {
      const error = new Error('API não retornou dados dos monitores');
      mockRepository.findWithPagination.mockReturnValue(throwError(() => error));

      service.getMonitorsWithPagination().subscribe({
        next: () => fail('deveria ter lançado erro'),
        error: (err) => {
          expect(err).toBeTruthy();
          expect(err.message).toContain('API não retornou dados dos monitores');
          expect(mockRepository.findWithPagination).toHaveBeenCalledTimes(1);
          done();
        }
      });
    });
  });

  describe('getMonitorById', () => {
    it('deve buscar monitor por ID', (done) => {
      const monitorId = 'mon-1';
      mockRepository.findById.mockReturnValue(of(mockMonitor));

      service.getMonitorById(monitorId).subscribe((response) => {
        expect(response).toBeTruthy();
        expect(response!.id).toBe('mon-1');
        expect(response!.active).toBe(true);
        expect(mockRepository.findById).toHaveBeenCalledTimes(1);
        expect(mockRepository.findById).toHaveBeenCalledWith(monitorId);
        done();
      });
    });

    it('deve retornar null quando monitor não é encontrado', (done) => {
      const monitorId = 'mon-999';
      mockRepository.findById.mockReturnValue(of(null));

      service.getMonitorById(monitorId).subscribe((response) => {
        expect(response).toBeNull();
        expect(mockRepository.findById).toHaveBeenCalledTimes(1);
        expect(mockRepository.findById).toHaveBeenCalledWith(monitorId);
        done();
      });
    });
  });

  describe('createMonitor', () => {
    it('deve criar novo monitor e retornar true', (done) => {
      mockRepository.create.mockReturnValue(of(true));

      service.createMonitor(mockCreateRequest).subscribe((response) => {
        expect(response).toBe(true);
        expect(mockRepository.create).toHaveBeenCalledTimes(1);
        expect(mockRepository.create).toHaveBeenCalledWith(mockCreateRequest);
        done();
      });
    });

    it('deve retornar false quando criação falha', (done) => {
      mockRepository.create.mockReturnValue(of(false));

      service.createMonitor(mockCreateRequest).subscribe((response) => {
        expect(response).toBe(false);
        expect(mockRepository.create).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });

  describe('updateMonitor', () => {
    it('deve atualizar monitor existente e retornar true', (done) => {
      const monitorId = 'mon-1';
      mockRepository.update.mockReturnValue(of(true));

      service.updateMonitor(monitorId, mockUpdateRequest).subscribe((response) => {
        expect(response).toBe(true);
        expect(mockRepository.update).toHaveBeenCalledTimes(1);
        expect(mockRepository.update).toHaveBeenCalledWith(monitorId, mockUpdateRequest);
        done();
      });
    });

    it('deve retornar false quando atualização falha', (done) => {
      const monitorId = 'mon-1';
      mockRepository.update.mockReturnValue(of(false));

      service.updateMonitor(monitorId, mockUpdateRequest).subscribe((response) => {
        expect(response).toBe(false);
        expect(mockRepository.update).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });

  describe('deleteMonitor', () => {
    it('deve deletar monitor e retornar true', (done) => {
      const monitorId = 'mon-1';
      mockRepository.delete.mockReturnValue(of(true));

      service.deleteMonitor(monitorId).subscribe((response) => {
        expect(response).toBe(true);
        expect(mockRepository.delete).toHaveBeenCalledTimes(1);
        expect(mockRepository.delete).toHaveBeenCalledWith(monitorId);
        done();
      });
    });

    it('deve retornar false quando deleção falha', (done) => {
      const monitorId = 'mon-1';
      mockRepository.delete.mockReturnValue(of(false));

      service.deleteMonitor(monitorId).subscribe((response) => {
        expect(response).toBe(false);
        expect(mockRepository.delete).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });

  describe('getValidAds', () => {
    it('deve buscar ads válidos para um monitor', (done) => {
      const monitorId = 'mon-1';
      const mockAds = [
        { id: 'ad-1', link: 'http://example.com/ad1.jpg' },
        { id: 'ad-2', link: 'http://example.com/ad2.jpg' }
      ];

      mockRepository.findValidAds.mockReturnValue(of(mockAds));

      service.getValidAds(monitorId).subscribe((response) => {
        expect(response.length).toBe(2);
        expect(response[0].id).toBe('ad-1');
        expect(response[1].id).toBe('ad-2');
        expect(mockRepository.findValidAds).toHaveBeenCalledTimes(1);
        expect(mockRepository.findValidAds).toHaveBeenCalledWith(monitorId);
        done();
      });
    });

    it('deve retornar array vazio quando nenhum ad é encontrado', (done) => {
      const monitorId = 'mon-1';
      mockRepository.findValidAds.mockReturnValue(of([]));

      service.getValidAds(monitorId).subscribe((response) => {
        expect(response).toEqual([]);
        expect(mockRepository.findValidAds).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });

  describe('getMonitorAlerts', () => {
    it('deve retornar todos os alertas quando monitorId não é fornecido', (done) => {
      service.getMonitorAlerts().subscribe((alerts) => {
        expect(alerts.length).toBe(2);
        expect(alerts[0].id).toBe('a1');
        expect(alerts[0].title).toBe('HEARTBEAT_STALE');
        expect(alerts[0].status).toBe('critical');
        done();
      });
      const req = httpMock.expectOne((r) =>
        r.url.includes('monitoring/incidents')
      );
      req.flush({
        data: {
          list: [
            {
              id: 'a1',
              incidentType: 'HEARTBEAT_STALE',
              severity: 'CRITICAL',
              monitorId: 'm1',
              boxId: null,
              openedAt: '2024-01-01T00:00:00.000Z',
              closedAt: null,
              detailsJson: {},
            },
            {
              id: 'a2',
              incidentType: 'OTHER',
              severity: 'WARNING',
              monitorId: 'm2',
              boxId: null,
              openedAt: '2024-01-02T00:00:00.000Z',
              closedAt: null,
              detailsJson: {},
            },
          ],
          totalRecords: 2,
          totalPages: 1,
          currentPage: 1,
        },
        status: 200,
        message: 'ok',
      });
    });

    it('deve filtrar alertas por monitorId', (done) => {
      const monitorId = 'm1';

      service.getMonitorAlerts(monitorId).subscribe((alerts) => {
        expect(alerts.length).toBe(1);
        expect(alerts[0].monitorId).toBe(monitorId);
        done();
      });
      const req = httpMock.expectOne((r) =>
        r.url.includes('monitoring/incidents')
      );
      req.flush({
        data: {
          list: [
            {
              id: 'a1',
              incidentType: 'X',
              severity: 'CRITICAL',
              monitorId: 'm1',
              boxId: null,
              openedAt: '2024-01-01T00:00:00.000Z',
              closedAt: null,
              detailsJson: {},
            },
            {
              id: 'a2',
              incidentType: 'Y',
              severity: 'WARNING',
              monitorId: 'm2',
              boxId: null,
              openedAt: '2024-01-02T00:00:00.000Z',
              closedAt: null,
              detailsJson: {},
            },
          ],
          totalRecords: 2,
          totalPages: 1,
          currentPage: 1,
        },
        status: 200,
        message: 'ok',
      });
    });

    it('deve retornar array vazio quando a API falha', (done) => {
      service.getMonitorAlerts().subscribe((alerts) => {
        expect(alerts).toEqual([]);
        done();
      });
      const req = httpMock.expectOne((r) =>
        r.url.includes('monitoring/incidents')
      );
      req.flush('error', { status: 500, statusText: 'Server Error' });
    });
  });

  describe('acknowledgeAlert', () => {
    it('deve reconhecer alerta e retornar alerta atualizado', (done) => {
      const alertId = 'alert-1';
      const reason = 'Under investigation';

      service.acknowledgeAlert(alertId, reason).subscribe((alert) => {
        expect(alert.id).toBe(alertId);
        expect(alert.status).toBe('acknowledged');
        expect(alert.acknowledgeReason).toBe(reason);
        done();
      });
    });
  });

  describe('resolveAlert', () => {
    it('deve resolver alerta e retornar alerta atualizado', (done) => {
      const alertId = 'alert-1';

      service.resolveAlert(alertId).subscribe((alert) => {
        expect(alert.id).toBe(alertId);
        expect(alert.status).toBe('resolved');
        done();
      });
    });
  });
});
