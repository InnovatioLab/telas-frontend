import { HttpBackend, HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { CartRequestDto } from "@app/model/dto/request/cart-request.dto";
import { CartResponseDto } from "@app/model/dto/response/cart-response.dto";
import { ResponseDto } from "@app/model/dto/response/response.dto";
import { BehaviorSubject, catchError, map, Observable, tap } from "rxjs";
import { environment } from "src/environments/environment";

@Injectable({ providedIn: "root" })
export class CartService {
  private readonly apiUrl = environment.apiUrl + "carts";
  private readonly cartUpdated$ = new BehaviorSubject<CartResponseDto | null>(
    null
  );

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
    return this.http
      .get<ResponseDto<CartResponseDto | null>>(`${this.apiUrl}`, this.headers)
      .pipe(
        map((response: ResponseDto<CartResponseDto | null>) => {
          return response.data;
        }),
        tap((cart: CartResponseDto | null) => {
          this.cartUpdated$.next(cart);
        }),
        catchError((error) => {
          throw error;
        })
      );
  }
}
