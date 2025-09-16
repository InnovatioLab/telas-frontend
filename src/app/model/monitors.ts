import { Address, DefaultStatus } from "./client";
import { MonitorAdResponseDto } from "./dto/response/monitor-response.dto";

export enum MonitorType {
  BASIC = "BASIC",
  PREMIUM = "PREMIUM",
}

export interface Monitor {
  id: string;
  active?: boolean;
  type?: MonitorType;
  locationDescription?: string;
  size?: number;
  productId?: string;
  maxBlocks?: number;
  address?: Address;
  status?: DefaultStatus;
  lastUpdate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  name?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  adLinks?: MonitorAdResponseDto[];
  validAds?: any[];
  hasAvailableSlots?: boolean;
  fullAddress?: string;
  canBeDeleted?: boolean;
}

export interface MonitorAd {
  id: string;
  blockQuantity: number;
  monitor: Monitor;
  ad: any;
}
