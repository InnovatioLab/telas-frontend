import { Injectable, Inject, Optional } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IAdRepository } from '@app/core/interfaces/services/repository/ad-repository.interface';
import { AdResponseDto } from '@app/model/dto/response/ad-response.dto';
import { CreateClientAdDto } from '@app/model/dto/request/create-client-ad.dto';
import { Page } from '@app/model/dto/page.dto';
import { ResponseDTO } from '@app/model/dto/response.dto';
import { BaseRepository } from './base.repository';
import { ENVIRONMENT } from 'src/environments/environment-token';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class AdRepositoryImpl extends BaseRepository<AdResponseDto, CreateClientAdDto, CreateClientAdDto> implements IAdRepository {
  constructor(
    httpClient: HttpClient,
    @Optional() @Inject(ENVIRONMENT) env?: any
  ) {
    super(httpClient, 'ads', env);
  }

  getPendingAds(page: number = 0, size: number = 10): Observable<Page<AdResponseDto>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http
      .get<ResponseDTO<Page<AdResponseDto>>>(`${this.baseUrl}/pending-ads`, { ...this.getHeaders(), params })
      .pipe(map((response) => response.data));
  }

  getApprovedAds(page: number = 0, size: number = 10): Observable<Page<AdResponseDto>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http
      .get<ResponseDTO<Page<AdResponseDto>>>(`${this.baseUrl}/approved-ads`, { ...this.getHeaders(), params })
      .pipe(map((response) => response.data));
  }

  getRejectedAds(page: number = 0, size: number = 10): Observable<Page<AdResponseDto>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http
      .get<ResponseDTO<Page<AdResponseDto>>>(`${this.baseUrl}/rejected-ads`, { ...this.getHeaders(), params })
      .pipe(map((response) => response.data));
  }

  getAllAds(page: number = 0, size: number = 10): Observable<Page<AdResponseDto>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http
      .get<ResponseDTO<Page<AdResponseDto>>>(`${this.baseUrl}/all`, { ...this.getHeaders(), params })
      .pipe(map((response) => response.data));
  }

  createClientAd(clientId: string, dto: CreateClientAdDto): Observable<any> {
    const apiUrl = this.env?.apiUrl || environment.apiUrl;
    return this.http.post(`${apiUrl}clients/ads/${clientId}`, dto, this.getHeaders());
  }

  override findAll(): Observable<AdResponseDto[]> {
    return this.getAllAds().pipe(map((page) => page.content || []));
  }

  override findById(): Observable<AdResponseDto | null> {
    return this.findAll().pipe(map((ads) => ads[0] || null));
  }

  override create(): Observable<AdResponseDto> {
    return this.findAll().pipe(map((ads) => ads[0] || {} as AdResponseDto));
  }

  override update(): Observable<AdResponseDto> {
    return this.findAll().pipe(map((ads) => ads[0] || {} as AdResponseDto));
  }

  override delete(): Observable<boolean> {
    return this.findAll().pipe(map(() => false));
  }

  override findWithPagination(): Observable<any> {
    return this.getAllAds().pipe(map((page) => ({
      list: page.content || [],
      totalElements: page.totalElements || 0,
      totalPages: page.totalPages || 0,
      currentPage: page.number || 0,
      size: page.size || 0,
      hasNext: !page.last || false,
      hasPrevious: !page.first || false,
    })));
  }
}

