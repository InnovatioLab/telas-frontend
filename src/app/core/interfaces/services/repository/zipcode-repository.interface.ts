import { Observable } from 'rxjs';
import { AddressData } from '@app/model/dto/request/address-data-request';

export interface IZipCodeRepository {
  findByZipCode(zipCode: string): Observable<AddressData | null>;
  saveAddress(address: AddressData): Observable<AddressData>;
  findAddressesByZipCode(zipCode: string): Observable<AddressData[]>;
}

