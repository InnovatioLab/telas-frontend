import { Injectable, Inject, Optional } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { ITermsConditionsRepository } from '@app/core/interfaces/services/repository/terms-conditions-repository.interface';
import { TermoCondicao } from '@app/model/termo-condicao';
import { ResponseDTO } from '@app/model/dto/response.dto';
import { BaseRepository } from './base.repository';
import { ENVIRONMENT } from 'src/environments/environment-token';

@Injectable({ providedIn: 'root' })
export class TermsConditionsRepositoryImpl extends BaseRepository<TermoCondicao, any, any> implements ITermsConditionsRepository {
  constructor(
    httpClient: HttpClient,
    @Optional() @Inject(ENVIRONMENT) env?: any
  ) {
    super(httpClient, 'terms_conditions', env);
  }

  pegarTermoCondicao(): Observable<TermoCondicao> {
    return this.http
      .get<ResponseDTO<TermoCondicao>>(this.baseUrl, this.getHeaders())
      .pipe(map((res: ResponseDTO<TermoCondicao>) => res.data));
  }

  override findAll(): Observable<TermoCondicao[]> {
    return this.pegarTermoCondicao().pipe(map((term) => [term]));
  }

  override findById(): Observable<TermoCondicao | null> {
    return this.pegarTermoCondicao();
  }

  override create(): Observable<TermoCondicao> {
    return this.pegarTermoCondicao();
  }

  override update(): Observable<TermoCondicao> {
    return this.pegarTermoCondicao();
  }

  override delete(): Observable<boolean> {
    return of(false);
  }

  override findWithPagination(): Observable<any> {
    return this.pegarTermoCondicao().pipe(map((term) => ({
      list: [term],
      totalElements: 1,
      totalPages: 1,
      currentPage: 0,
      size: 1,
      hasNext: false,
      hasPrevious: false,
    })));
  }
}

