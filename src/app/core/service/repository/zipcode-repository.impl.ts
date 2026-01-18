import { Injectable, Inject, Optional } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { IZipCodeRepository } from '@app/core/interfaces/services/repository/zipcode-repository.interface';
import { AddressData } from '@app/model/dto/request/address-data-request';
import { ResponseDTO } from '@app/model/dto/response.dto';
import { LocalAddressResponse } from '@app/model/dto/response/local-address-response';
import { BaseRepository } from './base.repository';
import { ENVIRONMENT } from 'src/environments/environment-token';

@Injectable({
  providedIn: 'root'
})
export class ZipCodeRepositoryImpl extends BaseRepository<AddressData, AddressData, AddressData> implements IZipCodeRepository {
  constructor(
    httpClient: HttpClient,
    @Optional() @Inject(ENVIRONMENT) env?: any
  ) {
    super(httpClient, 'addresses', env);
  }

  findByZipCode(zipCode: string): Observable<AddressData | null> {
    if (!zipCode) {
      return of(null);
    }

    return this.http.get<ResponseDTO<LocalAddressResponse>>(`${this.baseUrl}/${zipCode}`, this.getHeaders()).pipe(
      map(response => {
        if (response.data && response.data.zipCode) {
          return this.mapToAddressData(response.data);
        }
        return null;
      }),
      catchError(() => {
        return of(null);
      })
    );
  }

  override create(address: AddressData): Observable<AddressData> {
    return this.saveAddress(address);
  }

  saveAddress(address: AddressData): Observable<AddressData> {
    return this.http.post<ResponseDTO<AddressData>>(`${this.baseUrl}`, address, this.getHeaders()).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  findAddressesByZipCode(zipCode: string): Observable<AddressData[]> {
    if (!zipCode) {
      return of([]);
    }

    return this.http.get<ResponseDTO<AddressData[]>>(`${this.baseUrl}/zipcode/${zipCode}/all`, this.getHeaders()).pipe(
      map(response => response.data || []),
      catchError(() => of([]))
    );
  }

  override findAll(): Observable<AddressData[]> {
    return of([]);
  }

  override findById(): Observable<AddressData | null> {
    return of(null);
  }

  override update(): Observable<AddressData> {
    return of({} as AddressData);
  }

  override delete(): Observable<boolean> {
    return of(false);
  }

  override findWithPagination(): Observable<any> {
    return of({
      list: [],
      totalElements: 0,
      totalPages: 0,
      currentPage: 0,
      size: 0,
      hasNext: false,
      hasPrevious: false,
    });
  }

  private mapToAddressData(localResponse: LocalAddressResponse): AddressData {
    return {
      zipCode: localResponse.zipCode,
      latitude: localResponse.latitude?.toString() || '',
      longitude: localResponse.longitude?.toString() || '',
      city: localResponse.city || '',
      state: localResponse.state || '',
      country: localResponse.country || 'Brasil',
      street: localResponse.street || '',
    };
  }

  protected override handleError(error: any): Observable<never> {
    return throwError(() => new Error(error.message || 'Server error'));
  }
}
