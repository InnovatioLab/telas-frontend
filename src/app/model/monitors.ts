import { Address, DefaultStatus } from "./client";

export enum MonitorType {
  BASIC = 'BASIC',
  PREMIUM = 'PREMIUM',
  ADVANCED = 'ADVANCED'
}

export interface Monitor {
  id: string;
  active: boolean;
  type: MonitorType;
  locationDescription?: string;
  size: number;
  productId?: string;
  maxBlocks?: number;
  address: Address;
  status?: DefaultStatus;
  lastUpdate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  name?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  adLinks?: string[];
  validAds?: any[];
  hasAvailableSlots?: boolean;
  fullAddress?: string;
}

export interface MonitorAd {
  id: string;
  blockQuantity: number;
  monitor: Monitor;
  ad: any;
}
