import { HttpBackend, HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { CartRequestDto } from "@app/model/dto/request/cart-request.dto";
import { CartResponseDto } from "@app/model/dto/response/cart-response.dto";
import { ResponseDto } from "@app/model/dto/response/response.dto";
import {
  BehaviorSubject,
  catchError,
  map,
  Observable,
  shareReplay,
  tap,
} from "rxjs";
import { environment } from "src/environments/environment";

@Injectable({ providedIn: "root" })
export class CartService {
  private readonly apiUrl = environment.apiUrl + "carts";
  private readonly cartUpdated$ = new BehaviorSubject<CartResponseDto | null>(
    null
  );

  // Cache para evitar requests duplicados
  private activeCartRequest$: Observable<CartResponseDto | null> | null = null;
  private isLoaded = false;

  storageName = "telas_token";
  token = localStorage.getItem(this.storageName);
  httpBackend = new HttpClient(inject(HttpBackend));

  headers = {
    headers: {
      Authorization: `Bearer ${this.token}`,
    },
  };

  // Observable público para componentes se inscreverem
  public get cartUpdatedStream$(): Observable<CartResponseDto | null> {
    return this.cartUpdated$.asObservable();
  }

  // Getter para acessar o valor atual do carrinho
  public get currentCart(): CartResponseDto | null {
    return this.cartUpdated$.value;
  }

  constructor(private readonly http: HttpClient) {}

  addToCart(request: CartRequestDto): Observable<CartResponseDto> {
    return this.http
      .post<
        ResponseDto<CartResponseDto>
      >(`${this.apiUrl}`, request, this.headers)
      .pipe(
        map((response: ResponseDto<CartResponseDto>) => {
          return response.data;
        }),
        tap((cart: CartResponseDto) => {
          this.cartUpdated$.next(cart);
          this.markAsModified(); // Marca como modificado
        }),
        catchError((error) => {
          console.error("Error while adding item to cart:", error);
          throw error;
        })
      );
  }

  update(request: CartRequestDto, id: string): Observable<CartResponseDto> {
    return this.http
      .put<
        ResponseDto<CartResponseDto>
      >(`${this.apiUrl}/${id}`, request, this.headers)
      .pipe(
        map((response: ResponseDto<CartResponseDto>) => {
          return response.data;
        }),
        tap((cart: CartResponseDto) => {
          this.cartUpdated$.next(cart);
          this.markAsModified(); // Marca como modificado
        }),
        catchError((error) => {
          console.error("Error while updating cart:", error);
          throw error;
        })
      );
  }

  getById(id: string): Observable<CartResponseDto> {
    return this.http
      .get<ResponseDto<CartResponseDto>>(`${this.apiUrl}/${id}`, this.headers)
      .pipe(
        map((response: ResponseDto<CartResponseDto>) => {
          return response.data;
        }),
        catchError((error) => {
          throw error;
        })
      );
  }

  getLoggedUserCart(): Observable<CartResponseDto | null> {
    return this.http
      .get<ResponseDto<CartResponseDto | null>>(`${this.apiUrl}`, this.headers)
      .pipe(
        map((response: ResponseDto<CartResponseDto | null>) => {
          return response.data;
        }),
        catchError((error) => {
          throw error;
        })
      );
  }

  getLoggedUserActiveCart(): Observable<CartResponseDto | null> {
    // Se já temos dados carregados, retorna o stream
    if (this.isLoaded) {
      return this.cartUpdated$.asObservable();
    }

    // Se já existe um request em andamento, retorna ele
    if (this.activeCartRequest$) {
      return this.activeCartRequest$;
    }

    // Cria o request único
    this.activeCartRequest$ = this.http
      .get<ResponseDto<CartResponseDto | null>>(`${this.apiUrl}`, this.headers)
      .pipe(
        map((response: ResponseDto<CartResponseDto | null>) => {
          return response.data;
        }),
        tap((cart: CartResponseDto | null) => {
          this.cartUpdated$.next(cart);
          this.isLoaded = true;
          this.activeCartRequest$ = null; // Limpa o request após completar
        }),
        shareReplay(1), // Compartilha resultado entre subscrições simultâneas
        catchError((error) => {
          this.activeCartRequest$ = null;
          throw error;
        })
      );

    return this.activeCartRequest$;
  }

  // Método para inicializar os dados do carrinho (use apenas uma vez na aplicação)
  initializeCart(): void {
    if (!this.isLoaded && !this.activeCartRequest$) {
      this.getLoggedUserActiveCart().subscribe({
        error: (error) => {
          console.error("Error initializing cart:", error);
        },
      });
    }
  }

  // Método para forçar refresh do carrinho
  refreshActiveCart(): Observable<CartResponseDto | null> {
    this.isLoaded = false;
    this.activeCartRequest$ = null;
    return this.getLoggedUserActiveCart();
  }

  // Método para indicar que os dados foram modificados
  private markAsModified(): void {
    this.isLoaded = false;
    this.activeCartRequest$ = null;
  }
}
