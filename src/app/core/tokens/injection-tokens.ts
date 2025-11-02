import { InjectionToken } from '@angular/core';
import { IClientRepository } from '../interfaces/services/repository/client-repository.interface';
import { IClientManagementRepository } from '../interfaces/services/repository/client-management-repository.interface';
import { ISubscriptionRepository } from '../interfaces/services/repository/subscription-repository.interface';
import { IBoxRepository } from '../interfaces/services/repository/box-repository.interface';
import { ICartRepository } from '../interfaces/services/repository/cart-repository.interface';
import { IMonitorRepository } from '../interfaces/services/repository/monitor-repository.interface';
import { IZipCodeRepository } from '../interfaces/services/repository/zipcode-repository.interface';

export const CLIENT_REPOSITORY_TOKEN = new InjectionToken<IClientRepository>('CLIENT_REPOSITORY');
export const CLIENT_MANAGEMENT_REPOSITORY_TOKEN = new InjectionToken<IClientManagementRepository>('CLIENT_MANAGEMENT_REPOSITORY');
export const SUBSCRIPTION_REPOSITORY_TOKEN = new InjectionToken<ISubscriptionRepository>('SUBSCRIPTION_REPOSITORY');
export const BOX_REPOSITORY_TOKEN = new InjectionToken<IBoxRepository>('BOX_REPOSITORY');
export const CART_REPOSITORY_TOKEN = new InjectionToken<ICartRepository>('CART_REPOSITORY');
export const MONITOR_REPOSITORY_TOKEN = new InjectionToken<IMonitorRepository>('MONITOR_REPOSITORY');
export const ZIPCODE_REPOSITORY_TOKEN = new InjectionToken<IZipCodeRepository>('ZIPCODE_REPOSITORY');


