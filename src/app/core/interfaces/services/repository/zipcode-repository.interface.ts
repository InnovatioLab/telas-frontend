import { Observable } from 'rxjs';
import { AddressData } from '@app/model/dto/request/address-data-request';
import { IRepository } from './repository.interface';
import { IBaseFilterDto } from '@app/model/interfaces/dto-interfaces';

export interface ZipCodeFilterDto extends IBaseFilterDto {}

export interface IZipCodeRepository extends IRepository<AddressData, AddressData, AddressData, ZipCodeFilterDto> {
  findByZipCode(zipCode: string): Observable<AddressData | null>;
  findAddressesByZipCode(zipCode: string): Observable<AddressData[]>;
}
