import { InjectionToken } from '@angular/core';
import { IClientRepository } from '../interfaces/services/repository/client-repository.interface';
import { IZipCodeRepository } from '../interfaces/services/repository/zipcode-repository.interface';

export const CLIENT_REPOSITORY_TOKEN = new InjectionToken<IClientRepository>('CLIENT_REPOSITORY');
export const ZIPCODE_REPOSITORY_TOKEN = new InjectionToken<IZipCodeRepository>('ZIPCODE_REPOSITORY');

