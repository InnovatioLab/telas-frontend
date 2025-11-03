import { InjectionToken } from '@angular/core';
import { IClientManagementRepository } from '../interfaces/services/repository/client-management-repository.interface';
import { IClientRepository } from '../interfaces/services/repository/client-repository.interface';
import { ISubscriptionRepository } from '../interfaces/services/repository/subscription-repository.interface';
import { IZipCodeRepository } from '../interfaces/services/repository/zipcode-repository.interface';

export const CLIENT_REPOSITORY_TOKEN = new InjectionToken<IClientRepository>('CLIENT_REPOSITORY');
export const CLIENT_MANAGEMENT_REPOSITORY_TOKEN = new InjectionToken<IClientManagementRepository>('CLIENT_MANAGEMENT_REPOSITORY');
export const SUBSCRIPTION_REPOSITORY_TOKEN = new InjectionToken<ISubscriptionRepository>('SUBSCRIPTION_REPOSITORY');
export const ZIPCODE_REPOSITORY_TOKEN = new InjectionToken<IZipCodeRepository>('ZIPCODE_REPOSITORY');


