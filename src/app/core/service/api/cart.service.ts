import { Injectable, Inject } from "@angular/core";
import { CartRequestDto } from "@app/model/dto/request/cart-request.dto";
import { CartResponseDto } from "@app/model/dto/response/cart-response.dto";
import {
  BehaviorSubject,
  catchError,
  Observable,
  shareReplay,
  tap,
} from "rxjs";
import { ICartRepository } from "@app/core/interfaces/services/repository/cart-repository.interface";
import { CART_REPOSITORY_TOKEN } from "@app/core/tokens/injection-tokens";

@Injectable({ providedIn: "root" })
export class CartService {
  private readonly cartUpdated$ = new BehaviorSubject<CartResponseDto | null>(
    null
  );

  private activeCartRequest$: Observable<CartResponseDto | null> | null = null;
  private isLoaded = false;

  public get cartUpdatedStream$(): Observable<CartResponseDto | null> {
    return this.cartUpdated$.asObservable();
  }

  public get currentCart(): CartResponseDto | null {
    return this.cartUpdated$.value;
  }

  constructor(
    @Inject(CART_REPOSITORY_TOKEN) 
    private readonly repository: ICartRepository
  ) {}

  addToCart(request: CartRequestDto): Observable<CartResponseDto> {
    return this.repository.create(request).pipe(
      tap((cart: CartResponseDto) => {
        this.cartUpdated$.next(cart);
        this.markAsModified();
      }),
      catchError((error) => {
        console.error("Error while adding item to cart:", error);
        throw error;
      })
    );
  }

  update(request: CartRequestDto, id: string): Observable<CartResponseDto> {
    return this.repository.update(request, id).pipe(
      tap((cart: CartResponseDto) => {
        this.cartUpdated$.next(cart);
        this.markAsModified();
      }),
      catchError((error) => {
        console.error("Error while updating cart:", error);
        throw error;
      })
    );
  }

  getById(id: string): Observable<CartResponseDto> {
    return this.repository.findById(id);
  }

  getLoggedUserCart(): Observable<CartResponseDto | null> {
    return this.repository.findLoggedUserCart();
  }

  getLoggedUserActiveCart(): Observable<CartResponseDto | null> {
    if (this.isLoaded) {
      return this.cartUpdated$.asObservable();
    }

    if (this.activeCartRequest$) {
      return this.activeCartRequest$;
    }

    this.activeCartRequest$ = this.repository.findLoggedUserCart().pipe(
      tap((cart: CartResponseDto | null) => {
        this.cartUpdated$.next(cart);
        this.isLoaded = true;
        this.activeCartRequest$ = null;
      }),
      shareReplay(1),
      catchError((error) => {
        this.activeCartRequest$ = null;
        throw error;
      })
    );

    return this.activeCartRequest$;
  }

  initializeCart(): void {
    if (!this.isLoaded && !this.activeCartRequest$) {
      this.getLoggedUserActiveCart().subscribe({
        error: (error) => {
          console.error("Error initializing cart:", error);
        },
      });
    }
  }

  refreshActiveCart(): Observable<CartResponseDto | null> {
    this.isLoaded = false;
    this.activeCartRequest$ = null;
    return this.getLoggedUserActiveCart();
  }

  private markAsModified(): void {
    this.isLoaded = false;
    this.activeCartRequest$ = null;
  }
}
