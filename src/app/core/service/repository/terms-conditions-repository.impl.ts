import { Injectable, Inject, Optional } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { ITermsConditionsRepository } from '@app/core/interfaces/services/repository/terms-conditions-repository.interface';
import { TermsConditions } from '@app/model/terms-conditions';
import { ResponseDTO } from '@app/model/dto/response.dto';
import { BaseRepository } from './base.repository';
import { ENVIRONMENT } from 'src/environments/environment-token';

@Injectable({ providedIn: 'root' })
export class TermsConditionsRepositoryImpl extends BaseRepository<TermsConditions, any, any> implements ITermsConditionsRepository {
  constructor(
    httpClient: HttpClient,
    @Optional() @Inject(ENVIRONMENT) env?: any
  ) {
    super(httpClient, 'terms_conditions', env);
  }

  pegarTermsConditions(): Observable<TermsConditions> {
    return this.http
      .get<ResponseDTO<TermsConditions>>(this.baseUrl, this.getHeaders())
      .pipe(map((res: ResponseDTO<TermsConditions>) => res.data));
  }

  override findAll(): Observable<TermsConditions[]> {
    return this.pegarTermsConditions().pipe(map((term) => [term]));
  }

  override findById(): Observable<TermsConditions | null> {
    return this.pegarTermsConditions();
  }

  override create(): Observable<TermsConditions> {
    return this.pegarTermsConditions();
  }

  override update(): Observable<TermsConditions> {
    return this.pegarTermsConditions();
  }

  override delete(): Observable<boolean> {
    return of(false);
  }

  override findWithPagination(): Observable<any> {
    return this.pegarTermsConditions().pipe(map((term) => ({
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

