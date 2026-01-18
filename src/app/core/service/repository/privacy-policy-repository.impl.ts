import { Injectable, Inject, Optional } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { IPrivacyPolicyRepository } from '@app/core/interfaces/services/repository/privacy-policy-repository.interface';
import { PoliticaPrivacidade } from '@app/model/politica-privacidade';
import { ResponseDTO } from '@app/model/dto/response.dto';
import { BaseRepository } from './base.repository';
import { ENVIRONMENT } from 'src/environments/environment-token';

@Injectable({ providedIn: 'root' })
export class PrivacyPolicyRepositoryImpl extends BaseRepository<PoliticaPrivacidade, any, any> implements IPrivacyPolicyRepository {
  constructor(
    httpClient: HttpClient,
    @Optional() @Inject(ENVIRONMENT) env?: any
  ) {
    super(httpClient, 'privacy-policy', env);
  }

  pegarPoliticaPrivacidade(): Observable<PoliticaPrivacidade> {
    return this.http
      .get<ResponseDTO<PoliticaPrivacidade>>(this.baseUrl, this.getHeaders())
      .pipe(map((res: ResponseDTO<PoliticaPrivacidade>) => res.data));
  }

  override findAll(): Observable<PoliticaPrivacidade[]> {
    return this.pegarPoliticaPrivacidade().pipe(map((policy) => [policy]));
  }

  override findById(): Observable<PoliticaPrivacidade | null> {
    return this.pegarPoliticaPrivacidade();
  }

  override create(): Observable<PoliticaPrivacidade> {
    return this.pegarPoliticaPrivacidade();
  }

  override update(): Observable<PoliticaPrivacidade> {
    return this.pegarPoliticaPrivacidade();
  }

  override delete(): Observable<boolean> {
    return of(false);
  }

  override findWithPagination(): Observable<any> {
    return this.pegarPoliticaPrivacidade().pipe(map((policy) => ({
      list: [policy],
      totalElements: 1,
      totalPages: 1,
      currentPage: 0,
      size: 1,
      hasNext: false,
      hasPrevious: false,
    })));
  }
}

