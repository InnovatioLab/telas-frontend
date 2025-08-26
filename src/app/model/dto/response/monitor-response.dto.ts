import { DefaultStatus } from "@app/model/client";
import { MonitorType } from "@app/model/monitors";

export interface MonitorResponseDto {
  id: string;
  name?: string;
  location?: string;
  status?: DefaultStatus;
  lastUpdate?: Date;
  type: MonitorType;
  active: boolean;
  locationDescription?: string;
  size?: number;
  productId?: string;
  maxBlocks?: number;
  fullAddress?: string;
  address?: {
    id: string;
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    complement?: string;
    latitude?: number;
    longitude?: number;
  };
  adLinks?: MonitorAdResponseDto[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MonitorAdResponseDto {
  id: string;
  link: string;
  fileName: string;
  orderIndex?: number;
}
