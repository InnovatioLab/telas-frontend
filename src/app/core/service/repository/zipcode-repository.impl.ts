import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { IZipCodeRepository } from '@app/core/interfaces/services/repository/zipcode-repository.interface';
import { AddressData } from '@app/model/dto/request/address-data-request';
import { ResponseDTO } from '@app/model/dto/response.dto';
import { LocalAddressResponse } from '@app/model/dto/response/local-address-response';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ZipCodeRepositoryImpl implements IZipCodeRepository {
  private readonly baseUrl = `${environment.apiUrl}addresses`;

  constructor(private http: HttpClient) {}

  findByZipCode(zipCode: string): Observable<AddressData | null> {
    if (!zipCode) {
      return of(null);
    }

    return this.http.get<ResponseDTO<LocalAddressResponse>>(`${this.baseUrl}/zipcode/${zipCode}`).pipe(
      map(response => {
        if (response.data) {
          return this.mapToAddressData(response.data);
        }
        return null;
      }),
      catchError(() => of(null))
    );
  }

  saveAddress(address: AddressData): Observable<AddressData> {
    return this.http.post<ResponseDTO<AddressData>>(`${this.baseUrl}`, address).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  findAddressesByZipCode(zipCode: string): Observable<AddressData[]> {
    if (!zipCode) {
      return of([]);
    }

    return this.http.get<ResponseDTO<AddressData[]>>(`${this.baseUrl}/zipcode/${zipCode}/all`).pipe(
      map(response => response.data || []),
      catchError(() => of([]))
    );
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

  private handleError(error: any): Observable<never> {
    console.error('ZipCode Repository Error:', error);
    return throwError(() => new Error(error.message || 'Server error'));
  }
}
