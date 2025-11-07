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
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { BoxService } from '../box.service';
import { Box } from '@app/model/box';
import { BoxAddress } from '@app/model/box-address';
import { BoxRequestDto } from '@app/model/dto/request/box-request.dto';
import { FilterBoxRequestDto } from '@app/model/dto/request/filter-box-request.dto';
import { MonitorsBoxMinResponseDto } from '@app/model/dto/response/monitor-box-min-response.dto';
import { PaginationResponseDto } from '@app/model/dto/response/pagination-response.dto';
import { Monitor } from '@app/model/monitors';
import { BOX_REPOSITORY_TOKEN } from '@app/core/tokens/injection-tokens';
import { IBoxRepository } from '@app/core/interfaces/services/repository/box-repository.interface';
import { of } from 'rxjs';

describe('BoxService', () => {
  let service: BoxService;
  let mockRepository: jest.Mocked<IBoxRepository>;

  const mockBox: Box = {
    id: 'box-1',
    ip: '192.168.1.100',
    macAddress: 'AA:BB:CC:DD:EE:FF',
    boxAddressId: 'addr-1',
    monitorIds: ['mon-1', 'mon-2'],
    active: true,
    monitorCount: 2
  };

  const mockBoxAddress: BoxAddress = {
    id: 'addr-1',
    mac: 'AA:BB:CC:DD:EE:FF',
    ip: '192.168.1.100'
  };

  const mockMonitor: Monitor = {
    id: 'mon-1',
    active: true
  } as Monitor;

  const mockMonitorsBoxMin: MonitorsBoxMinResponseDto = {
    monitorIds: ['mon-1'],
    hasBox: false,
    fullAddress: 'Address 1'
  };

  const mockPaginationResponse: PaginationResponseDto<Box> = {
    list: [mockBox],
    totalElements: 1,
    totalPages: 1,
    currentPage: 0,
    size: 10,
    hasNext: false,
    hasPrevious: false
  };

  beforeEach(() => {
    mockRepository = {
      findAvailableAddresses: jest.fn(),
      findAvailableMonitors: jest.fn(),
      findAll: jest.fn(),
      findWithPagination: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMonitorsByIp: jest.fn()
    } as any;

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        BoxService,
        { provide: BOX_REPOSITORY_TOKEN, useValue: mockRepository }
      ],
    });

    service = TestBed.inject(BoxService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('deve ser criado', () => {
      expect(service).toBeTruthy();
    });
  });

  describe('getAvailableBoxAddresses', () => {
    it('deve buscar endereços de boxes disponíveis', (done) => {
      const mockAddresses = [mockBoxAddress];
      mockRepository.findAvailableAddresses.mockReturnValue(of(mockAddresses));

      service.getAvailableBoxAddresses().subscribe((response) => {
        expect(response).toBeTruthy();
        expect(response!.length).toBe(1);
        expect(response![0].id).toBe('addr-1');
        expect(response![0].ip).toBe('192.168.1.100');
        expect(response![0].mac).toBe('AA:BB:CC:DD:EE:FF');
        expect(mockRepository.findAvailableAddresses).toHaveBeenCalledTimes(1);
        done();
      });
    });

    it('deve retornar null quando repository retorna null', (done) => {
      mockRepository.findAvailableAddresses.mockReturnValue(of(null as any));

      service.getAvailableBoxAddresses().subscribe((response) => {
        expect(response).toBeNull();
        expect(mockRepository.findAvailableAddresses).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });

  describe('getAvailableMonitors', () => {
    it('deve buscar monitores disponíveis', (done) => {
      const mockMonitors = [mockMonitorsBoxMin];
      mockRepository.findAvailableMonitors.mockReturnValue(of(mockMonitors));

      service.getAvailableMonitors().subscribe((response) => {
        expect(response.length).toBe(1);
        expect(response[0].monitorIds[0]).toBe('mon-1');
        expect(mockRepository.findAvailableMonitors).toHaveBeenCalledTimes(1);
        done();
      });
    });

    it('deve retornar array vazio quando repository retorna array vazio', (done) => {
      mockRepository.findAvailableMonitors.mockReturnValue(of([]));

      service.getAvailableMonitors().subscribe((response) => {
        expect(response).toEqual([]);
        expect(mockRepository.findAvailableMonitors).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });

  describe('getBoxes', () => {
    it('deve buscar boxes sem filtros', (done) => {
      const mockBoxes = [mockBox];
      mockRepository.findAll.mockReturnValue(of(mockBoxes));

      service.getBoxes().subscribe((response) => {
        expect(response.length).toBe(1);
        expect(response[0].id).toBe('box-1');
        expect(response[0].ip).toBe('192.168.1.100');
        expect(response[0].monitorIds.length).toBe(2);
        expect(mockRepository.findAll).toHaveBeenCalledTimes(1);
        expect(mockRepository.findAll).toHaveBeenCalledWith(undefined);
        done();
      });
    });

    it('deve buscar boxes com filtros completos', (done) => {
      const filters: FilterBoxRequestDto = {
        page: 1,
        size: 5,
        sortBy: 'ip',
        sortDir: 'asc',
        genericFilter: '192.168',
        active: true
      };

      const mockBoxes = [mockBox];
      mockRepository.findAll.mockReturnValue(of(mockBoxes));

      service.getBoxes(filters).subscribe((response) => {
        expect(response.length).toBe(1);
        expect(mockRepository.findAll).toHaveBeenCalledTimes(1);
        expect(mockRepository.findAll).toHaveBeenCalledWith(filters);
        done();
      });
    });

    it('deve retornar array vazio quando repository retorna array vazio', (done) => {
      mockRepository.findAll.mockReturnValue(of([]));

      service.getBoxes().subscribe((response) => {
        expect(response).toEqual([]);
        expect(mockRepository.findAll).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });

  describe('getBoxesWithPagination', () => {
    it('deve buscar boxes com paginação sem filtros', (done) => {
      mockRepository.findWithPagination.mockReturnValue(of(mockPaginationResponse));

      service.getBoxesWithPagination().subscribe((response) => {
        expect(response.list.length).toBe(1);
        expect(response.totalElements).toBe(1);
        expect(response.totalPages).toBe(1);
        expect(response.currentPage).toBe(0);
        expect(response.size).toBe(10);
        expect(response.hasNext).toBe(false);
        expect(response.hasPrevious).toBe(false);
        expect(mockRepository.findWithPagination).toHaveBeenCalledTimes(1);
        expect(mockRepository.findWithPagination).toHaveBeenCalledWith(undefined);
        done();
      });
    });

    it('deve buscar boxes com paginação e filtros', (done) => {
      const filters: FilterBoxRequestDto = {
        page: 2,
        size: 20,
        active: false
      };

      mockRepository.findWithPagination.mockReturnValue(of(mockPaginationResponse));

      service.getBoxesWithPagination(filters).subscribe((response) => {
        expect(response.list.length).toBe(1);
        expect(mockRepository.findWithPagination).toHaveBeenCalledTimes(1);
        expect(mockRepository.findWithPagination).toHaveBeenCalledWith(filters);
        done();
      });
    });

    it('deve retornar paginação vazia quando repository retorna paginação vazia', (done) => {
      const emptyPagination: PaginationResponseDto<Box> = {
        list: [],
        totalElements: 0,
        totalPages: 0,
        currentPage: 0,
        size: 0,
        hasNext: false,
        hasPrevious: false
      };

      mockRepository.findWithPagination.mockReturnValue(of(emptyPagination));

      service.getBoxesWithPagination().subscribe((response) => {
        expect(response.list).toEqual([]);
        expect(response.totalElements).toBe(0);
        expect(mockRepository.findWithPagination).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });

  describe('getBoxById', () => {
    it('deve buscar box por ID', (done) => {
      const boxId = 'box-1';
      mockRepository.findById.mockReturnValue(of(mockBox));

      service.getBoxById(boxId).subscribe((response) => {
        expect(response).toBeTruthy();
        expect(response!.id).toBe('box-1');
        expect(response!.ip).toBe('192.168.1.100');
        expect(response!.monitorIds.length).toBe(2);
        expect(mockRepository.findById).toHaveBeenCalledTimes(1);
        expect(mockRepository.findById).toHaveBeenCalledWith(boxId);
        done();
      });
    });

    it('deve retornar null quando box não é encontrado', (done) => {
      const boxId = 'box-999';
      mockRepository.findById.mockReturnValue(of(null));

      service.getBoxById(boxId).subscribe((response) => {
        expect(response).toBeNull();
        expect(mockRepository.findById).toHaveBeenCalledTimes(1);
        expect(mockRepository.findById).toHaveBeenCalledWith(boxId);
        done();
      });
    });
  });

  describe('createBox', () => {
    it('deve criar novo box', (done) => {
      const boxRequest: BoxRequestDto = {
        boxAddressId: 'addr-1',
        monitorIds: ['mon-1', 'mon-2'],
        active: true
      };

      mockRepository.create.mockReturnValue(of(mockBox));

      service.createBox(boxRequest).subscribe((response) => {
        expect(response).toBeTruthy();
        expect(response.id).toBe('box-1');
        expect(mockRepository.create).toHaveBeenCalledTimes(1);
        expect(mockRepository.create).toHaveBeenCalledWith(boxRequest);
        done();
      });
    });
  });

  describe('updateBox', () => {
    it('deve atualizar box existente', (done) => {
      const boxId = 'box-1';
      const boxRequest: BoxRequestDto = {
        boxAddressId: 'addr-1',
        monitorIds: ['mon-1'],
        active: false
      };

      const updatedBox: Box = { ...mockBox, active: false };
      mockRepository.update.mockReturnValue(of(updatedBox));

      service.updateBox(boxId, boxRequest).subscribe((response) => {
        expect(response).toBeTruthy();
        expect(response.id).toBe('box-1');
        expect(response.active).toBe(false);
        expect(mockRepository.update).toHaveBeenCalledTimes(1);
        expect(mockRepository.update).toHaveBeenCalledWith(boxId, boxRequest);
        done();
      });
    });
  });

  describe('deleteBox', () => {
    it('deve deletar box e retornar true', (done) => {
      const boxId = 'box-1';
      mockRepository.delete.mockReturnValue(of(true));

      service.deleteBox(boxId).subscribe((response) => {
        expect(response).toBe(true);
        expect(mockRepository.delete).toHaveBeenCalledTimes(1);
        expect(mockRepository.delete).toHaveBeenCalledWith(boxId);
        done();
      });
    });

    it('deve retornar false quando deleção falha', (done) => {
      const boxId = 'box-1';
      mockRepository.delete.mockReturnValue(of(false));

      service.deleteBox(boxId).subscribe((response) => {
        expect(response).toBe(false);
        expect(mockRepository.delete).toHaveBeenCalledTimes(1);
        expect(mockRepository.delete).toHaveBeenCalledWith(boxId);
        done();
      });
    });
  });

  describe('getMonitorsAdsByIp', () => {
    it('deve buscar monitores por IP', (done) => {
      const ip = '192.168.1.100';
      const mockMonitors = [mockMonitor];

      mockRepository.findMonitorsByIp.mockReturnValue(of(mockMonitors));

      service.getMonitorsAdsByIp(ip).subscribe((response) => {
        expect(response.length).toBe(1);
        expect(response[0].id).toBe('mon-1');
        expect(mockRepository.findMonitorsByIp).toHaveBeenCalledTimes(1);
        expect(mockRepository.findMonitorsByIp).toHaveBeenCalledWith(ip);
        done();
      });
    });

    it('deve retornar array vazio quando nenhum monitor é encontrado', (done) => {
      const ip = '192.168.1.100';
      mockRepository.findMonitorsByIp.mockReturnValue(of([]));

      service.getMonitorsAdsByIp(ip).subscribe((response) => {
        expect(response).toEqual([]);
        expect(mockRepository.findMonitorsByIp).toHaveBeenCalledTimes(1);
        expect(mockRepository.findMonitorsByIp).toHaveBeenCalledWith(ip);
        done();
      });
    });
  });
});
