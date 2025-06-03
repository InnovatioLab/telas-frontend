import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { AddressData } from '../../model/dto/request/address-data-request';
import { ENVIRONMENT } from 'src/environments/environment-token';
import { LocalAddressResponse } from '@app/model/dto/response/local-address-response';
import { ZipCodeResponse } from '@app/model/dto/response/zipcode-response';



@Injectable({
  providedIn: 'root'
})
export class ZipCodeService {
  private readonly baseUrl = 'https://app.zipcodebase.com/api/v1';
  private readonly env = inject(ENVIRONMENT);
  private readonly apiKeyBackup = '9bdde870-2bf6-11f0-92e4-ab00f677d113';
  private readonly localApiUrl = this.env.apiUrl || '';

  constructor(private readonly http: HttpClient) {}

  public findLocationByZipCode(zipCode: string): Observable<AddressData | null> {
    if (!zipCode) {
      return of(null);
    }

    return this.findLocationInLocalApi(zipCode).pipe(
      map(localResult => {
        if (localResult && this.isAddressValid(localResult)) {
          return localResult;
        }
        return null;
      }),
      switchMap(localResult => {
        if (localResult) {
          return of(localResult); 
        }
        return this.findLocationInExternalApi(zipCode);
      })
    );
  }

  private isAddressValid(address: AddressData): boolean {
    return !!address.city && !!address.state && !!address.country;
  }

  private findLocationInLocalApi(zipCode: string): Observable<AddressData | null> {
    const url = `${this.localApiUrl}addresses/${zipCode}`;
    
    return this.http.get<LocalAddressResponse>(url).pipe(
      map(response => {
        if (response?.zipCode) {
          return {
            zipCode: response.zipCode,
            street: response.street || '',
            city: response.city || '',
            state: response.state || '',
            country: response.country || '',
            latitude: null as string | null,
            longitude: null as string | null
          };
        }
        return null;
      }),
      catchError(() => of(null))
    );
  }

  private findLocationInExternalApi(zipCode: string): Observable<AddressData | null> {
    const apiKey = this.env.zipCodeApiKey || this.apiKeyBackup;
    const url = `${this.baseUrl}/search?apikey=${apiKey}&codes=${zipCode}&country=us`;

    return this.http.get<ZipCodeResponse>(url).pipe(
      map(response => {
        const location = response?.results?.[zipCode]?.[0];
        if (location) {
          return {
            zipCode: location.postal_code || zipCode,
            city: location.city || location.city_en || '',
            state: location.state_code || location.state || location.state_en || '',
            country: location.country_code || '',
            latitude: location.latitude || '',
            longitude: location.longitude || '',
          };
        }

        return {
          zipCode,
          city: '',
          state: '',
          country: '',
          latitude: '',
          longitude: '',
        };
      }),
      catchError(() => of(null))
    );
  }

  public getStatesList(): Observable<{ code: string; name: string }[]> {
    const usStates = [
      { code: 'AL', name: 'Alabama' },
      { code: 'AK', name: 'Alaska' },
      { code: 'AZ', name: 'Arizona' },
      { code: 'AR', name: 'Arkansas' },
      { code: 'CA', name: 'California' },
      { code: 'CO', name: 'Colorado' },
      { code: 'CT', name: 'Connecticut' },
      { code: 'DE', name: 'Delaware' },
      { code: 'FL', name: 'Florida' },
      { code: 'GA', name: 'Georgia' },
      { code: 'HI', name: 'Hawaii' },
      { code: 'ID', name: 'Idaho' },
      { code: 'IL', name: 'Illinois' },
      { code: 'IN', name: 'Indiana' },
      { code: 'IA', name: 'Iowa' },
      { code: 'KS', name: 'Kansas' },
      { code: 'KY', name: 'Kentucky' },
      { code: 'LA', name: 'Louisiana' },
      { code: 'ME', name: 'Maine' },
      { code: 'MD', name: 'Maryland' },
      { code: 'MA', name: 'Massachusetts' },
      { code: 'MI', name: 'Michigan' },
      { code: 'MN', name: 'Minnesota' },
      { code: 'MS', name: 'Mississippi' },
      { code: 'MO', name: 'Missouri' },
      { code: 'MT', name: 'Montana' },
      { code: 'NE', name: 'Nebraska' },
      { code: 'NV', name: 'Nevada' },
      { code: 'NH', name: 'New Hampshire' },
      { code: 'NJ', name: 'New Jersey' },
      { code: 'NM', name: 'New Mexico' },
      { code: 'NY', name: 'New York' },
      { code: 'NC', name: 'North Carolina' },
      { code: 'ND', name: 'North Dakota' },
      { code: 'OH', name: 'Ohio' },
      { code: 'OK', name: 'Oklahoma' },
      { code: 'OR', name: 'Oregon' },
      { code: 'PA', name: 'Pennsylvania' },
      { code: 'RI', name: 'Rhode Island' },
      { code: 'SC', name: 'South Carolina' },
      { code: 'SD', name: 'South Dakota' },
      { code: 'TN', name: 'Tennessee' },
      { code: 'TX', name: 'Texas' },
      { code: 'UT', name: 'Utah' },
      { code: 'VT', name: 'Vermont' },
      { code: 'VA', name: 'Virginia' },
      { code: 'WA', name: 'Washington' },
      { code: 'WV', name: 'West Virginia' },
      { code: 'WI', name: 'Wisconsin' },
      { code: 'WY', name: 'Wyoming' }
    ];
    
    return of(usStates);
  }
}
