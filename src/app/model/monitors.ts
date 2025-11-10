import { Address, DefaultStatus } from "./client";
import { MonitorAdResponseDto } from "./dto/response/monitor-response.dto";

export interface Monitor {
  id: string;
  active?: boolean;
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
