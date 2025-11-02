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
import { SubscriptionService, FilterSubscriptionRequestDto } from '../subscription.service';
import { PaginationResponseDto } from '@app/model/dto/response/pagination-response.dto';
import { SubscriptionMinResponseDto } from '@app/model/dto/response/subscription-response.dto';
import { Subscription } from '@app/model/subscription';
import { Recurrence } from '@app/model/enums/recurrence.enum';
import { SubscriptionStatus } from '@app/model/enums/subscription-status.enum';
import { PaymentStatus } from '@app/model/enums/payment-status.enum';
import { SUBSCRIPTION_REPOSITORY_TOKEN } from '@app/core/tokens/injection-tokens';
import { ISubscriptionRepository } from '@app/core/interfaces/services/repository/subscription-repository.interface';
import { of, throwError } from 'rxjs';

describe('SubscriptionService', () => {
  let service: SubscriptionService;
  let httpMock: HttpTestingController;
  let mockRepository: jest.Mocked<ISubscriptionRepository>;

  const mockSubscriptionMin1: SubscriptionMinResponseDto = {
    id: 'sub-1',
    amount: 100,
    recurrence: Recurrence.MONTHLY,
    bonus: false,
    status: SubscriptionStatus.ACTIVE,
    startedAt: '2024-01-01T00:00:00Z',
    endsAt: '2024-02-01T00:00:00Z',
    daysLeft: 15,
    ableToUpgrade: true,
    ableToRenew: true,
    monitors: []
  };

  const mockSubscriptionMin2: SubscriptionMinResponseDto = {
    id: 'sub-2',
    amount: 200,
    recurrence: Recurrence.THIRTY_DAYS,
    bonus: true,
    status: SubscriptionStatus.CANCELLED,
    startedAt: '2024-02-01T00:00:00Z',
    endsAt: '2024-03-01T00:00:00Z',
    daysLeft: 0,
    ableToUpgrade: false,
    ableToRenew: false,
    monitors: []
  };

  const mockSubscription: Subscription = {
    id: 'sub-1',
    recurrence: Recurrence.MONTHLY,
    bonus: false,
    status: SubscriptionStatus.ACTIVE,
    payments: [{
      id: 'pay-1',
      amount: 100,
      paymentMethod: 'card',
      currency: 'USD',
      status: PaymentStatus.COMPLETED
    }],
    monitors: [{
      id: 'mon-1',
      addressData: '123 Main St'
    } as any],
    startedAt: '2024-01-01T00:00:00Z',
    endsAt: '2024-02-01T00:00:00Z'
  };

  beforeEach(() => {
    mockRepository = {
      findWithPagination: jest.fn(),
      checkout: jest.fn(),
      findById: jest.fn(),
      upgrade: jest.fn(),
      renew: jest.fn(),
      getCustomerPortalUrl: jest.fn(),
      delete: jest.fn()
    } as any;

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        SubscriptionService,
        { provide: SUBSCRIPTION_REPOSITORY_TOKEN, useValue: mockRepository }
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    service = TestBed.inject(SubscriptionService);
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

  describe('getClientSubscriptionsFilters', () => {
    it('deve buscar subscriptions com paginação sem filtros', (done) => {
      const mockPaginationResponse: PaginationResponseDto<SubscriptionMinResponseDto> = {
        list: [mockSubscriptionMin1, mockSubscriptionMin2],
        totalElements: 2,
        totalPages: 1,
        currentPage: 0,
        size: 10,
        hasNext: false,
        hasPrevious: false
      };

      mockRepository.findWithPagination.mockReturnValue(of(mockPaginationResponse));

      service.getClientSubscriptionsFilters().subscribe((response) => {
        expect(response.list.length).toBe(2);
        expect(response.list[0].id).toBe('sub-1');
        expect(response.list[1].id).toBe('sub-2');
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

    it('deve buscar subscriptions com filtros completos', (done) => {
      const filters: FilterSubscriptionRequestDto = {
        page: 1,
        size: 5,
        sortBy: 'amount',
        sortDir: 'desc',
        genericFilter: 'active'
      };

      const mockPaginationResponse: PaginationResponseDto<SubscriptionMinResponseDto> = {
        list: [mockSubscriptionMin1],
        totalElements: 1,
        totalPages: 1,
        currentPage: 1,
        size: 5,
        hasNext: false,
        hasPrevious: true
      };

      mockRepository.findWithPagination.mockReturnValue(of(mockPaginationResponse));

      service.getClientSubscriptionsFilters(filters).subscribe((response) => {
        expect(response.list.length).toBe(1);
        expect(response.totalElements).toBe(1);
        expect(response.currentPage).toBe(1);
        expect(response.size).toBe(5);
        expect(mockRepository.findWithPagination).toHaveBeenCalledWith(filters);
        done();
      });
    });

    it('deve retornar lista vazia quando repository retorna lista vazia', (done) => {
      const mockPaginationResponse: PaginationResponseDto<SubscriptionMinResponseDto> = {
        list: [],
        totalElements: 0,
        totalPages: 0,
        currentPage: 0,
        size: 0,
        hasNext: false,
        hasPrevious: false
      };

      mockRepository.findWithPagination.mockReturnValue(of(mockPaginationResponse));

      service.getClientSubscriptionsFilters().subscribe((response) => {
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
  });

  describe('checkout', () => {
    it('deve criar checkout e retornar URL', (done) => {
      const checkoutUrl = 'https://checkout.stripe.com/pay/test123';
      mockRepository.checkout.mockReturnValue(of(checkoutUrl));

      service.checkout().subscribe((response) => {
        expect(response).toBe(checkoutUrl);
        expect(mockRepository.checkout).toHaveBeenCalled();
        done();
      });
    });

    it('deve propagar erro do repository', (done) => {
      const error = new Error('Repository error');
      mockRepository.checkout.mockReturnValue(throwError(() => error));

      service.checkout().subscribe({
        next: () => fail('deveria ter lançado erro'),
        error: (err) => {
          expect(err).toEqual(error);
          expect(mockRepository.checkout).toHaveBeenCalled();
          done();
        }
      });
    });
  });

  describe('getById', () => {
    it('deve buscar subscription por ID e mapear corretamente', (done) => {
      const subscriptionId = 'sub-1';
      mockRepository.findById.mockReturnValue(of(mockSubscription));

      service.getById(subscriptionId).subscribe((response) => {
        expect(response).toBeTruthy();
        expect(response!.id).toBe('sub-1');
        expect(response!.recurrence).toBe(Recurrence.MONTHLY);
        expect(response!.status).toBe(SubscriptionStatus.ACTIVE);
        expect(response!.payments.length).toBe(1);
        expect(response!.payments[0].id).toBe('pay-1');
        expect(response!.payments[0].amount).toBe(100);
        expect(response!.monitors.length).toBe(1);
        expect(response!.monitors[0].id).toBe('mon-1');
        expect(response!.startedAt).toBe('2024-01-01T00:00:00Z');
        expect(response!.endsAt).toBe('2024-02-01T00:00:00Z');
        expect(mockRepository.findById).toHaveBeenCalledWith(subscriptionId);
        done();
      });
    });

    it('deve retornar null quando repository retorna null', (done) => {
      const subscriptionId = 'sub-999';
      mockRepository.findById.mockReturnValue(of(null));

      service.getById(subscriptionId).subscribe((response) => {
        expect(response).toBeNull();
        expect(mockRepository.findById).toHaveBeenCalledWith(subscriptionId);
        done();
      });
    });
  });

  describe('upgrade', () => {
    it('deve fazer upgrade de subscription', (done) => {
      const subscriptionId = 'sub-1';
      const recurrence = Recurrence.SIXTY_DAYS;
      const upgradeUrl = 'https://checkout.stripe.com/upgrade/test123';
      mockRepository.upgrade.mockReturnValue(of(upgradeUrl));

      service.upgrade(subscriptionId, recurrence).subscribe((response) => {
        expect(response).toBe(upgradeUrl);
        expect(mockRepository.upgrade).toHaveBeenCalledWith(subscriptionId, recurrence);
        done();
      });
    });

    it('deve propagar erro do repository', (done) => {
      const subscriptionId = 'sub-1';
      const recurrence = Recurrence.MONTHLY;
      const error = new Error('Upgrade failed');
      mockRepository.upgrade.mockReturnValue(throwError(() => error));

      service.upgrade(subscriptionId, recurrence).subscribe({
        next: () => fail('deveria ter lançado erro'),
        error: (err) => {
          expect(err).toEqual(error);
          expect(mockRepository.upgrade).toHaveBeenCalledWith(subscriptionId, recurrence);
          done();
        }
      });
    });
  });

  describe('renew', () => {
    it('deve renovar subscription', (done) => {
      const subscriptionId = 'sub-1';
      const renewUrl = 'https://checkout.stripe.com/renew/test123';
      mockRepository.renew.mockReturnValue(of(renewUrl));

      service.renew(subscriptionId).subscribe((response) => {
        expect(response).toBe(renewUrl);
        expect(mockRepository.renew).toHaveBeenCalledWith(subscriptionId);
        done();
      });
    });

    it('deve propagar erro do repository', (done) => {
      const subscriptionId = 'sub-1';
      const error = new Error('Renewal failed');
      mockRepository.renew.mockReturnValue(throwError(() => error));

      service.renew(subscriptionId).subscribe({
        next: () => fail('deveria ter lançado erro'),
        error: (err) => {
          expect(err).toEqual(error);
          expect(mockRepository.renew).toHaveBeenCalledWith(subscriptionId);
          done();
        }
      });
    });
  });

  describe('getCustomerPortalUrl', () => {
    it('deve buscar URL do customer portal', (done) => {
      const portalUrl = 'https://billing.stripe.com/p/session/test123';
      mockRepository.getCustomerPortalUrl.mockReturnValue(of(portalUrl));

      service.getCustomerPortalUrl().subscribe((response) => {
        expect(response).toBe(portalUrl);
        expect(mockRepository.getCustomerPortalUrl).toHaveBeenCalled();
        done();
      });
    });

    it('deve propagar erro do repository', (done) => {
      const error = new Error('Portal URL failed');
      mockRepository.getCustomerPortalUrl.mockReturnValue(throwError(() => error));

      service.getCustomerPortalUrl().subscribe({
        next: () => fail('deveria ter lançado erro'),
        error: (err) => {
          expect(err).toEqual(error);
          expect(mockRepository.getCustomerPortalUrl).toHaveBeenCalled();
          done();
        }
      });
    });
  });

  describe('delete', () => {
    it('deve deletar subscription e retornar true quando repository retorna true', (done) => {
      const subscriptionId = 'sub-1';
      mockRepository.delete.mockReturnValue(of(true));

      service.delete(subscriptionId).subscribe((response) => {
        expect(response).toBe(true);
        expect(mockRepository.delete).toHaveBeenCalledWith(subscriptionId);
        done();
      });
    });

    it('deve retornar false quando repository retorna false', (done) => {
      const subscriptionId = 'sub-1';
      mockRepository.delete.mockReturnValue(of(false));

      service.delete(subscriptionId).subscribe((response) => {
        expect(response).toBe(false);
        expect(mockRepository.delete).toHaveBeenCalledWith(subscriptionId);
        done();
      });
    });

    it('deve propagar erro do repository', (done) => {
      const subscriptionId = 'sub-1';
      const error = new Error('Delete failed');
      mockRepository.delete.mockReturnValue(throwError(() => error));

      service.delete(subscriptionId).subscribe({
        next: () => fail('deveria ter lançado erro'),
        error: (err) => {
          expect(err).toEqual(error);
          expect(mockRepository.delete).toHaveBeenCalledWith(subscriptionId);
          done();
        }
      });
    });
  });
});
