import { Injectable, Inject, Optional } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { IPrivacyPolicyRepository } from '@app/core/interfaces/services/repository/privacy-policy-repository.interface';
import { PrivacyPolicy } from '@app/model/privacy-policy';
import { ResponseDTO } from '@app/model/dto/response.dto';
import { BaseRepository } from './base.repository';
import { ENVIRONMENT } from 'src/environments/environment-token';

@Injectable({ providedIn: 'root' })
export class PrivacyPolicyRepositoryImpl extends BaseRepository<PrivacyPolicy, any, any> implements IPrivacyPolicyRepository {
  constructor(
    httpClient: HttpClient,
    @Optional() @Inject(ENVIRONMENT) env?: any
  ) {
    super(httpClient, 'privacy-policy', env);
  }

  pegarPrivacyPolicy(): Observable<PrivacyPolicy> {
    return this.http
      .get<ResponseDTO<PrivacyPolicy>>(this.baseUrl, this.getHeaders())
      .pipe(map((res: ResponseDTO<PrivacyPolicy>) => res.data));
  }

  override findAll(): Observable<PrivacyPolicy[]> {
    return this.pegarPrivacyPolicy().pipe(map((policy) => [policy]));
  }

  override findById(): Observable<PrivacyPolicy | null> {
    return this.pegarPrivacyPolicy();
  }

  override create(): Observable<PrivacyPolicy> {
    return this.pegarPrivacyPolicy();
  }

  override update(): Observable<PrivacyPolicy> {
    return this.pegarPrivacyPolicy();
  }

  override delete(): Observable<boolean> {
    return of(false);
  }

  override findWithPagination(): Observable<any> {
    return this.pegarPrivacyPolicy().pipe(map((policy) => ({
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

