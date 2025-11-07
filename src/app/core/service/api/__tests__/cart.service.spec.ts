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
import { CartService } from '../cart.service';
import { CartRequestDto, CartItemRequestDto } from '@app/model/dto/request/cart-request.dto';
import { CartResponseDto, CartItemResponseDto } from '@app/model/dto/response/cart-response.dto';
import { CART_REPOSITORY_TOKEN } from '@app/core/tokens/injection-tokens';
import { ICartRepository } from '@app/core/interfaces/services/repository/cart-repository.interface';
import { of, throwError } from 'rxjs';

describe('CartService', () => {
  let service: CartService;
  let mockRepository: jest.Mocked<ICartRepository>;

  const mockCartItem: CartItemResponseDto = {
    id: 'item-1',
    monitorId: 'mon-1',
    blockQuantity: 5
  } as CartItemResponseDto;

  const mockCartResponse: CartResponseDto = {
    id: 'cart-1',
    active: true,
    recurrence: 'MONTHLY' as any,
    items: [mockCartItem]
  } as CartResponseDto;

  const mockCartRequest: CartRequestDto = {
    recurrence: 'MONTHLY' as any,
    items: [
      { monitorId: 'mon-1', blockQuantity: 5 } as CartItemRequestDto
    ]
  };

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      findLoggedUserCart: jest.fn()
    } as any;

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        CartService,
        { provide: CART_REPOSITORY_TOKEN, useValue: mockRepository }
      ],
    });

    service = TestBed.inject(CartService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('deve ser criado', () => {
      expect(service).toBeTruthy();
    });

    it('deve inicializar cartUpdated$ com null', () => {
      expect(service.currentCart).toBeNull();
    });

    it('deve ter cartUpdatedStream$ como Observable', () => {
      expect(service.cartUpdatedStream$).toBeDefined();
    });
  });

  describe('addToCart', () => {
    it('deve adicionar item ao carrinho e atualizar BehaviorSubject', (done) => {
      mockRepository.create.mockReturnValue(of(mockCartResponse));

      service.addToCart(mockCartRequest).subscribe((response) => {
        expect(response).toBeTruthy();
        expect(response.id).toBe('cart-1');
        expect(response.items.length).toBe(1);
        expect(service.currentCart).toEqual(mockCartResponse);
        expect(mockRepository.create).toHaveBeenCalledTimes(1);
        expect(mockRepository.create).toHaveBeenCalledWith(mockCartRequest);
        done();
      });
    });

    it('deve lançar erro quando falha ao adicionar item', (done) => {
      mockRepository.create.mockReturnValue(throwError(() => new Error('Network error')));

      service.addToCart(mockCartRequest).subscribe({
        next: () => fail('deveria ter lançado erro'),
        error: (error) => {
          expect(error).toBeTruthy();
          expect(mockRepository.create).toHaveBeenCalledTimes(1);
          done();
        }
      });
    });
  });

  describe('update', () => {
    it('deve atualizar carrinho e atualizar BehaviorSubject', (done) => {
      const cartId = 'cart-1';
      const updatedCartResponse: CartResponseDto = {
        ...mockCartResponse,
        items: [
          { ...mockCartItem, blockQuantity: 10 }
        ]
      };

      mockRepository.update.mockReturnValue(of(updatedCartResponse));

      service.update(mockCartRequest, cartId).subscribe((response) => {
        expect(response).toBeTruthy();
        expect(response.items[0].blockQuantity).toBe(10);
        expect(service.currentCart).toEqual(updatedCartResponse);
        expect(mockRepository.update).toHaveBeenCalledTimes(1);
        expect(mockRepository.update).toHaveBeenCalledWith(mockCartRequest, cartId);
        done();
      });
    });

    it('deve lançar erro quando falha ao atualizar carrinho', (done) => {
      const cartId = 'cart-1';
      mockRepository.update.mockReturnValue(throwError(() => new Error('Network error')));

      service.update(mockCartRequest, cartId).subscribe({
        next: () => fail('deveria ter lançado erro'),
        error: (error) => {
          expect(error).toBeTruthy();
          expect(mockRepository.update).toHaveBeenCalledTimes(1);
          done();
        }
      });
    });
  });

  describe('getById', () => {
    it('deve buscar carrinho por ID', (done) => {
      const cartId = 'cart-1';
      mockRepository.findById.mockReturnValue(of(mockCartResponse));

      service.getById(cartId).subscribe((response) => {
        expect(response).toBeTruthy();
        expect(response.id).toBe('cart-1');
        expect(response.items.length).toBe(1);
        expect(mockRepository.findById).toHaveBeenCalledTimes(1);
        expect(mockRepository.findById).toHaveBeenCalledWith(cartId);
        done();
      });
    });

    it('deve lançar erro quando falha ao buscar carrinho', (done) => {
      const cartId = 'cart-1';
      mockRepository.findById.mockReturnValue(throwError(() => new Error('Network error')));

      service.getById(cartId).subscribe({
        next: () => fail('deveria ter lançado erro'),
        error: (error) => {
          expect(error).toBeTruthy();
          expect(mockRepository.findById).toHaveBeenCalledTimes(1);
          done();
        }
      });
    });
  });

  describe('getLoggedUserCart', () => {
    it('deve buscar carrinho do usuário logado', (done) => {
      mockRepository.findLoggedUserCart.mockReturnValue(of(mockCartResponse));

      service.getLoggedUserCart().subscribe((response) => {
        expect(response).toBeTruthy();
        expect(response!.id).toBe('cart-1');
        expect(mockRepository.findLoggedUserCart).toHaveBeenCalledTimes(1);
        done();
      });
    });

    it('deve retornar null quando usuário não tem carrinho', (done) => {
      mockRepository.findLoggedUserCart.mockReturnValue(of(null));

      service.getLoggedUserCart().subscribe((response) => {
        expect(response).toBeNull();
        expect(mockRepository.findLoggedUserCart).toHaveBeenCalledTimes(1);
        done();
      });
    });

    it('deve lançar erro quando falha ao buscar carrinho', (done) => {
      mockRepository.findLoggedUserCart.mockReturnValue(throwError(() => new Error('Network error')));

      service.getLoggedUserCart().subscribe({
        next: () => fail('deveria ter lançado erro'),
        error: (error) => {
          expect(error).toBeTruthy();
          expect(mockRepository.findLoggedUserCart).toHaveBeenCalledTimes(1);
          done();
        }
      });
    });
  });

  describe('getLoggedUserActiveCart', () => {
    it('deve buscar carrinho ativo do usuário e atualizar BehaviorSubject', (done) => {
      mockRepository.findLoggedUserCart.mockReturnValue(of(mockCartResponse));

      service.getLoggedUserActiveCart().subscribe((response) => {
        expect(response).toBeTruthy();
        expect(response!.id).toBe('cart-1');
        expect(service.currentCart).toEqual(mockCartResponse);
        expect((service as any).isLoaded).toBe(true);
        expect(mockRepository.findLoggedUserCart).toHaveBeenCalledTimes(1);
        done();
      });
    });

    it('deve retornar Observable do BehaviorSubject quando já está carregado', (done) => {
      (service as any).isLoaded = true;
      (service as any).cartUpdated$.next(mockCartResponse);

      service.getLoggedUserActiveCart().subscribe((response) => {
        expect(response).toEqual(mockCartResponse);
        expect(mockRepository.findLoggedUserCart).not.toHaveBeenCalled();
        done();
      });
    });

    it('deve compartilhar mesmo request quando múltiplas subscrições simultâneas', (done) => {
      mockRepository.findLoggedUserCart.mockReturnValue(of(mockCartResponse));

      let subscriptionCount = 0;
      const subscription1 = service.getLoggedUserActiveCart().subscribe(() => {
        subscriptionCount++;
        if (subscriptionCount === 2) {
          expect(mockRepository.findLoggedUserCart).toHaveBeenCalledTimes(1);
          done();
        }
      });

      const subscription2 = service.getLoggedUserActiveCart().subscribe(() => {
        subscriptionCount++;
        if (subscriptionCount === 2) {
          expect(mockRepository.findLoggedUserCart).toHaveBeenCalledTimes(1);
          done();
        }
      });

      subscription1.unsubscribe();
      subscription2.unsubscribe();
    });

    it('deve limpar activeCartRequest$ quando ocorre erro', (done) => {
      mockRepository.findLoggedUserCart.mockReturnValue(throwError(() => new Error('Network error')));

      service.getLoggedUserActiveCart().subscribe({
        next: () => fail('deveria ter lançado erro'),
        error: (error) => {
          expect(error).toBeTruthy();
          expect((service as any).activeCartRequest$).toBeNull();
          expect(mockRepository.findLoggedUserCart).toHaveBeenCalledTimes(1);
          done();
        }
      });
    });
  });

  describe('initializeCart', () => {
    it('deve inicializar carrinho quando não está carregado', (done) => {
      mockRepository.findLoggedUserCart.mockReturnValue(of(mockCartResponse));

      (service as any).isLoaded = false;
      (service as any).activeCartRequest$ = null;

      service.initializeCart();

      setTimeout(() => {
        expect(mockRepository.findLoggedUserCart).toHaveBeenCalledTimes(1);
        done();
      }, 100);
    });

    it('não deve fazer request quando já está carregado', () => {
      (service as any).isLoaded = true;

      service.initializeCart();

      expect(mockRepository.findLoggedUserCart).not.toHaveBeenCalled();
    });

    it('não deve fazer request quando já existe um request em andamento', () => {
      (service as any).isLoaded = false;
      (service as any).activeCartRequest$ = of(mockCartResponse);

      service.initializeCart();

      expect(mockRepository.findLoggedUserCart).not.toHaveBeenCalled();
    });
  });

  describe('refreshActiveCart', () => {
    it('deve forçar refresh do carrinho', (done) => {
      mockRepository.findLoggedUserCart.mockReturnValue(of(mockCartResponse));

      (service as any).isLoaded = true;
      (service as any).activeCartRequest$ = of(mockCartResponse);

      service.refreshActiveCart().subscribe((response) => {
        expect(response).toBeTruthy();
        expect(response!.id).toBe('cart-1');
        expect((service as any).isLoaded).toBe(true);
        expect(mockRepository.findLoggedUserCart).toHaveBeenCalledTimes(1);
        done();
      });
    });

    it('deve limpar cache antes de fazer refresh', (done) => {
      mockRepository.findLoggedUserCart.mockReturnValue(of(mockCartResponse));

      (service as any).isLoaded = true;
      (service as any).activeCartRequest$ = of(mockCartResponse);

      service.refreshActiveCart().subscribe(() => {
        expect((service as any).isLoaded).toBe(true);
        done();
      });
    });
  });

  describe('markAsModified', () => {
    it('deve marcar carrinho como modificado após addToCart', (done) => {
      mockRepository.create.mockReturnValue(of(mockCartResponse));

      (service as any).isLoaded = true;
      (service as any).activeCartRequest$ = of(mockCartResponse);

      service.addToCart(mockCartRequest).subscribe(() => {
        expect((service as any).isLoaded).toBe(false);
        expect((service as any).activeCartRequest$).toBeNull();
        expect(mockRepository.create).toHaveBeenCalledTimes(1);
        done();
      });
    });

    it('deve marcar carrinho como modificado após update', (done) => {
      const cartId = 'cart-1';
      mockRepository.update.mockReturnValue(of(mockCartResponse));

      (service as any).isLoaded = true;
      (service as any).activeCartRequest$ = of(mockCartResponse);

      service.update(mockCartRequest, cartId).subscribe(() => {
        expect((service as any).isLoaded).toBe(false);
        expect((service as any).activeCartRequest$).toBeNull();
        expect(mockRepository.update).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });
});
