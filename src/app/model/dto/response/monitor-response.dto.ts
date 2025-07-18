import { MonitorType } from '@app/model/monitors';
import { DefaultStatus } from '@app/model/client';

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
  createdAt?: Date;
  updatedAt?: Date;
} 