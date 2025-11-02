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
import { SearchMonitorsService, MonitorMapsResponseDto, ApiResponseDto } from '../search-monitors.service';
import { MapPoint } from '@app/core/service/state/map-point.interface';
import { ENVIRONMENT } from 'src/environments/environment-token';
import { Environment } from 'src/environments/environment.interface';
import { MonitorMapPointMapper } from '@app/core/service/mapper/monitor-map-point.mapper';
import { ZipCodeExtractor } from '@app/core/service/utils/zipcode-extractor.util';
import { of, throwError } from 'rxjs';
import { take } from 'rxjs/operators';

describe('SearchMonitorsService', () => {
  let service: SearchMonitorsService;
  let httpMock: HttpTestingController;
  let mockEnvironment: Environment;

  const mockMonitorResponse: MonitorMapsResponseDto = {
    id: 'mon-1',
    active: true,
    latitude: -23.5505,
    longitude: -46.6333,
    hasAvailableSlots: true,
    adsDailyDisplayTimeInMinutes: 120,
    addressLocationName: 'Test Address',
    addressLocationDescription: 'Test Description',
    monitorLocationDescription: 'Test Monitor',
    photoUrl: 'http://example.com/photo.jpg'
  };

  beforeEach(() => {
    mockEnvironment = {
      production: false,
      apiUrl: 'http://localhost:8080/api/',
      zipCodeApiKey: 'test-key',
      googleMapsApiKey: 'test-key',
      stripePublicKey: 'test-key',
      stripePrivateKey: 'test-key',
      emailSuporte: 'test@example.com',
      nomeToken: 'telas_token',
      nomeTokenRefresh: 'telas_token_refresh',
    };

    localStorage.clear();
    localStorage.setItem('telas_token', 'test-token');

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        SearchMonitorsService,
        MonitorMapPointMapper,
        { provide: ENVIRONMENT, useValue: mockEnvironment }
      ],
    });

    service = TestBed.inject(SearchMonitorsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Initialization', () => {
    it('deve ser criado', () => {
      expect(service).toBeTruthy();
    });

    it('deve inicializar nearestMonitors$ com array vazio', (done) => {
      service.nearestMonitors$.pipe(take(1)).subscribe((monitors) => {
        expect(monitors).toEqual([]);
        done();
      });
    });

    it('deve inicializar isLoading$ com false', (done) => {
      service.isLoading$.pipe(take(1)).subscribe((loading) => {
        expect(loading).toBe(false);
        done();
      });
    });

    it('deve inicializar error$ com null', (done) => {
      service.error$.pipe(take(1)).subscribe((error) => {
        expect(error).toBeNull();
        done();
      });
    });
  });

  describe('findNearestMonitors', () => {
    it('deve buscar monitores próximos por ZIP code', (done) => {
      const zipCode = '12345';
      const mockResponse: ApiResponseDto<MonitorMapsResponseDto[]> = {
        data: [mockMonitorResponse],
        status: 200,
        message: 'Success',
        timestamp: new Date().toISOString()
      };

      service.findNearestMonitors(zipCode).subscribe((monitors) => {
        expect(monitors.length).toBe(1);
        expect(monitors[0].id).toBe('mon-1');
        
        service.nearestMonitors$.pipe(take(1)).subscribe((points) => {
          expect(points.length).toBe(1);
          expect(points[0].id).toBe('mon-1');
          expect(points[0].category).toBe('MONITOR');
          done();
        });
      });


      const req = httpMock.expectOne(req => 
        req.url.includes('monitors/search') &&
        req.params.get('zipCode') === zipCode
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.has('Authorization')).toBeTruthy();
      req.flush(mockResponse);
    });

    it('deve retornar array vazio quando response.data é null', (done) => {
      const zipCode = '12345';
      const mockResponse: ApiResponseDto<MonitorMapsResponseDto[]> = {
        data: null as any,
        status: 200,
        message: 'Success',
        timestamp: new Date().toISOString()
      };

      service.findNearestMonitors(zipCode).subscribe((monitors) => {
        expect(monitors).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes('monitors/search'));
      req.flush(mockResponse);
    });

    it('deve tratar erro e atualizar errorSubject', (done) => {
      const zipCode = '12345';
      const errorMessage = 'Error searching for nearby monitors';

      service.findNearestMonitors(zipCode).subscribe((monitors) => {
        expect(monitors).toEqual([]);
      });

      let callCount = 0;
      service.error$.pipe(take(2)).subscribe((error) => {
        callCount++;
        if (callCount === 2) {
          expect(error).toBe(errorMessage);
          done();
        }
      });

      const req = httpMock.expectOne(req => req.url.includes('monitors/search'));
      req.error(new ErrorEvent('error', { message: errorMessage }));
    });

    it('deve filtrar monitores sem coordenadas', (done) => {
      const zipCode = '12345';
      const monitorsWithoutCoords: MonitorMapsResponseDto[] = [
        { ...mockMonitorResponse, latitude: 0, longitude: 0 },
        mockMonitorResponse
      ];

      const mockResponse: ApiResponseDto<MonitorMapsResponseDto[]> = {
        data: monitorsWithoutCoords,
        status: 200,
        message: 'Success',
        timestamp: new Date().toISOString()
      };

      service.findNearestMonitors(zipCode).subscribe(() => {
        service.nearestMonitors$.pipe(take(1)).subscribe((points) => {
          expect(points.length).toBe(1);
          expect(points[0].id).toBe('mon-1');
          done();
        });
      });

      const req = httpMock.expectOne(req => req.url.includes('monitors/search'));
      req.flush(mockResponse);
    });
  });

  describe('findByZipCode', () => {
    it('deve buscar monitores por ZIP code válido', async () => {
      const zipCode = '12345';
      const mockResponse: ApiResponseDto<MonitorMapsResponseDto[]> = {
        data: [mockMonitorResponse],
        status: 200,
        message: 'Success',
        timestamp: new Date().toISOString()
      };

      const promise = service.findByZipCode(zipCode);

      const req = httpMock.expectOne(req => 
        req.url.includes('monitors/search') &&
        req.params.get('zipCode') === zipCode
      );
      req.flush(mockResponse);

      const points = await promise;
      expect(points.length).toBe(1);
      expect(points[0].id).toBe('mon-1');
    });

    it('deve retornar array vazio para ZIP code inválido', async () => {
      const invalidZipCode = '123';

      const points = await service.findByZipCode(invalidZipCode);
      
      expect(points).toEqual([]);
      httpMock.expectNone(req => req.url.includes('monitors/search'));
    });

    it('deve limpar caracteres não numéricos do ZIP code', async () => {
      const zipCodeWithChars = '12-345';
      const cleanZipCode = '12345';
      const mockResponse: ApiResponseDto<MonitorMapsResponseDto[]> = {
        data: [mockMonitorResponse],
        status: 200,
        message: 'Success',
        timestamp: new Date().toISOString()
      };

      const promise = service.findByZipCode(zipCodeWithChars);

      const req = httpMock.expectOne(req => 
        req.url.includes('monitors/search') &&
        req.params.get('zipCode') === cleanZipCode
      );
      req.flush(mockResponse);

      await promise;
    });

    it('deve atualizar errorSubject quando nenhum monitor é encontrado', async () => {
      const zipCode = '12345';
      const mockResponse: ApiResponseDto<MonitorMapsResponseDto[]> = {
        data: [],
        status: 200,
        message: 'Success',
        timestamp: new Date().toISOString()
      };

      const promise = service.findByZipCode(zipCode);

      const req = httpMock.expectOne(req => req.url.includes('monitors/search'));
      req.flush(mockResponse);

      await promise;

      let callCount = 0;
      service.error$.pipe(take(2)).subscribe((error) => {
        callCount++;
        if (callCount === 2) {
          expect(error).toContain('No monitors found');
          expect(error).toContain(zipCode);
        }
      });
    });

    it('deve tratar erro e retornar array vazio', async () => {
      const zipCode = '12345';

      const promise = service.findByZipCode(zipCode);

      const req = httpMock.expectOne(req => req.url.includes('monitors/search'));
      req.error(new ErrorEvent('Network error'));

      const points = await promise;
      expect(points).toEqual([]);
    });
  });

  describe('searchNearestMonitorsByAddress', () => {
    it('deve buscar por ZIP code quando address é um ZIP code', async () => {
      const zipCode = '12345';
      const mockGoogleMapsService = {} as any;
      const mockResponse: ApiResponseDto<MonitorMapsResponseDto[]> = {
        data: [mockMonitorResponse],
        status: 200,
        message: 'Success',
        timestamp: new Date().toISOString()
      };

      const promise = service.searchNearestMonitorsByAddress(
        zipCode,
        mockGoogleMapsService
      );

      const req = httpMock.expectOne(req => req.url.includes('monitors/search'));
      req.flush(mockResponse);

      await promise;
    });

    it('deve buscar por endereço e extrair ZIP code', async () => {
      const address = '123 Main St, City, State 12345';
      const mockGeocodeResult = {
        formattedAddress: address
      };

      const mockGoogleMapsService = {
        searchAddress: jest.fn().mockResolvedValue(mockGeocodeResult)
      };

      (service as any).nearestMonitorsSubject.next([]);
      const initialPoints = (service as any).nearestMonitorsSubject.getValue();

      const points = await service.searchNearestMonitorsByAddress(
        address,
        mockGoogleMapsService
      );

      expect(mockGoogleMapsService.searchAddress).toHaveBeenCalledWith(address);
      expect(points).toEqual(initialPoints);
    });

    it('deve tratar erro quando endereço não é encontrado', async () => {
      const address = 'Invalid Address';
      const mockGoogleMapsService = {
        searchAddress: jest.fn().mockResolvedValue(null)
      };

      const points = await service.searchNearestMonitorsByAddress(
        address,
        mockGoogleMapsService
      );

      expect(points).toEqual([]);
      
      let callCount = 0;
      service.error$.pipe(take(2)).subscribe((error) => {
        callCount++;
        if (callCount === 2) {
          expect(error).toBeTruthy();
        }
      });
    });

    it('deve tratar erro quando ZIP code não pode ser extraído', async () => {
      const address = 'Address without ZIP code';
      const mockGeocodeResult = {
        formattedAddress: address
      };

      const mockGoogleMapsService = {
        searchAddress: jest.fn().mockResolvedValue(mockGeocodeResult)
      };

      const points = await service.searchNearestMonitorsByAddress(
        address,
        mockGoogleMapsService
      );

      expect(points).toEqual([]);
      
      let callCount = 0;
      service.error$.pipe(take(2)).subscribe((error) => {
        callCount++;
        if (callCount === 2) {
          expect(error).toContain('Unable to identify zip code');
        }
      });
    });
  });

  describe('ZipCodeExtractor', () => {
    it('deve extrair ZIP code brasileiro do endereço', () => {
      const address = 'Rua Test, 123 - São Paulo, SP 12345-678';
      const zipCode = ZipCodeExtractor.extractFromAddress(address);
      expect(zipCode).toBe('12345678');
    });

    it('deve extrair ZIP code americano do endereço', () => {
      const address = '123 Main St, New York, NY 12345';
      const zipCode = ZipCodeExtractor.extractFromAddress(address);
      expect(zipCode).toBe('12345');
    });

    it('deve extrair ZIP code americano com extensão', () => {
      const address = '123 Main St, New York, NY 12345-6789';
      const zipCode = ZipCodeExtractor.extractFromAddress(address);
      expect(zipCode).toBe('123456789');
    });

    it('deve retornar null quando não há ZIP code', () => {
      const address = 'Rua Test, 123 - São Paulo, SP';
      const zipCode = ZipCodeExtractor.extractFromAddress(address);
      expect(zipCode).toBeNull();
    });
  });


  describe('clearError', () => {
    it('deve limpar erro do errorSubject', (done) => {
      (service as any).errorSubject.next('Test error');

      service.clearError();

      service.error$.pipe(take(1)).subscribe((error) => {
        expect(error).toBeNull();
        done();
      });
    });
  });

  describe('Observables', () => {
    it('nearestMonitors$ deve emitir valores atualizados', (done) => {
      const zipCode = '12345';
      const mockResponse: ApiResponseDto<MonitorMapsResponseDto[]> = {
        data: [mockMonitorResponse],
        status: 200,
        message: 'Success',
        timestamp: new Date().toISOString()
      };

      let callCount = 0;
      service.nearestMonitors$.pipe(take(2)).subscribe((points) => {
        callCount++;
        if (callCount === 1) {
          expect(points).toEqual([]);
        } else {
          expect(points.length).toBe(1);
          expect(points[0].id).toBe('mon-1');
          done();
        }
      });

      service.findNearestMonitors(zipCode).subscribe();

      const req = httpMock.expectOne(req => req.url.includes('monitors/search'));
      req.flush(mockResponse);
    });

    it('isLoading$ deve emitir true durante busca e false após', (done) => {
      const zipCode = '12345';
      const mockResponse: ApiResponseDto<MonitorMapsResponseDto[]> = {
        data: [],
        status: 200,
        message: 'Success',
        timestamp: new Date().toISOString()
      };

      let callCount = 0;
      service.isLoading$.pipe(take(3)).subscribe((loading) => {
        callCount++;
        if (callCount === 1) expect(loading).toBe(false);
        if (callCount === 2) expect(loading).toBe(true);
        if (callCount === 3) {
          expect(loading).toBe(false);
          done();
        }
      });

      service.findNearestMonitors(zipCode).subscribe();

      const req = httpMock.expectOne(req => req.url.includes('monitors/search'));
      req.flush(mockResponse);
    });

  });
});

