import { DefaultStatus } from "@app/model/client";


export interface MonitorResponseDto {
  id: string;
  name?: string;
  status?: DefaultStatus;
  lastUpdate?: Date;
  active: boolean;
  locationDescription?: string;
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
    address2?: string;
    latitude?: number;
    longitude?: number;
  };
  adLinks?: MonitorAdResponseDto[];
  createdAt?: Date;
  updatedAt?: Date;
  canBeDeleted: boolean;
}

export interface MonitorAdResponseDto {
  id: string;
  link: string;
  fileName: string;
  orderIndex?: number;
}
