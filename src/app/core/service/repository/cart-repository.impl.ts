import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { ICartRepository } from '@app/core/interfaces/services/repository/cart-repository.interface';
import { CartRequestDto } from '@app/model/dto/request/cart-request.dto';
import { CartResponseDto } from '@app/model/dto/response/cart-response.dto';
import { ResponseDto } from '@app/model/dto/response/response.dto';

@Injectable({ providedIn: 'root' })
export class CartRepositoryImpl implements ICartRepository {
  private readonly baseUrl = `${environment.apiUrl}carts`;
  private readonly storageName = 'telas_token';
  private readonly token = localStorage.getItem(this.storageName);

  private readonly headers = {
    headers: {
      Authorization: `Bearer ${this.token}`,
    },
  };

  constructor(private readonly http: HttpClient) {}

  create(request: CartRequestDto): Observable<CartResponseDto> {
    return this.http
      .post<ResponseDto<CartResponseDto>>(this.baseUrl, request, this.headers)
      .pipe(map((response: ResponseDto<CartResponseDto>) => response.data));
  }

  update(request: CartRequestDto, id: string): Observable<CartResponseDto> {
    return this.http
      .put<ResponseDto<CartResponseDto>>(`${this.baseUrl}/${id}`, request, this.headers)
      .pipe(map((response: ResponseDto<CartResponseDto>) => response.data));
  }

  findById(id: string): Observable<CartResponseDto> {
    return this.http
      .get<ResponseDto<CartResponseDto>>(`${this.baseUrl}/${id}`, this.headers)
      .pipe(map((response: ResponseDto<CartResponseDto>) => response.data));
  }

  findLoggedUserCart(): Observable<CartResponseDto | null> {
    return this.http
      .get<ResponseDto<CartResponseDto | null>>(this.baseUrl, this.headers)
      .pipe(map((response: ResponseDto<CartResponseDto | null>) => response.data));
  }
}


