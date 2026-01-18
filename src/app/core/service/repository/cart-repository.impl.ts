import { Injectable, Inject, Optional } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ICartRepository } from '@app/core/interfaces/services/repository/cart-repository.interface';
import { CartRequestDto } from '@app/model/dto/request/cart-request.dto';
import { CartResponseDto } from '@app/model/dto/response/cart-response.dto';
import { ResponseDTO } from '@app/model/dto/response.dto';
import { ResponseDto } from '@app/model/dto/response/response.dto';
import { BaseRepository } from './base.repository';
import { ENVIRONMENT } from 'src/environments/environment-token';

@Injectable({ providedIn: 'root' })
export class CartRepositoryImpl extends BaseRepository<CartResponseDto, CartRequestDto, CartRequestDto> implements ICartRepository {
  constructor(
    httpClient: HttpClient,
    @Optional() @Inject(ENVIRONMENT) env?: any
  ) {
    super(httpClient, 'carts', env);
  }

  override create(request: CartRequestDto): Observable<CartResponseDto> {
    return this.http
      .post<ResponseDTO<CartResponseDto> | ResponseDto<CartResponseDto>>(this.baseUrl, request, this.getHeaders())
      .pipe(map((response) => this.extractData(response) as CartResponseDto));
  }

  override update(id: string, request: CartRequestDto): Observable<CartResponseDto> {
    return this.http
      .put<ResponseDTO<CartResponseDto> | ResponseDto<CartResponseDto>>(`${this.baseUrl}/${id}`, request, this.getHeaders())
      .pipe(map((response) => this.extractData(response) as CartResponseDto));
  }

  override findById(id: string): Observable<CartResponseDto | null> {
    return this.http
      .get<ResponseDTO<CartResponseDto> | ResponseDto<CartResponseDto>>(`${this.baseUrl}/${id}`, this.getHeaders())
      .pipe(map((response) => this.extractData(response) as CartResponseDto || null));
  }

  findLoggedUserCart(): Observable<CartResponseDto | null> {
    return this.http
      .get<ResponseDTO<CartResponseDto | null> | ResponseDto<CartResponseDto | null>>(this.baseUrl, this.getHeaders())
      .pipe(map((response) => this.extractData(response) as CartResponseDto | null));
  }
}
