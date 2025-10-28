import { Address, DefaultStatus } from "./client";
import { MonitorAdResponseDto } from "./dto/response/monitor-response.dto";

export enum MonitorType {
  BASIC = "BASIC",
  PREMIUM = "PREMIUM",
}

export interface Monitor {
  id: string;
  active?: boolean;
  locationDescription?: string;
  productId?: string;
  maxBlocks?: number;
  address?: Address;
  status?: DefaultStatus;
  createdAt?: Date;
  updatedAt?: Date;
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
