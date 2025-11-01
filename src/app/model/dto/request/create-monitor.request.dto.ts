import { AddressRequestDTO } from "./client-request.dto";

export interface CreateMonitorRequestDto {
  locationDescription?: string;
  address: AddressRequestDTO;
}

export interface UpdateMonitorRequestDto {
  addressId?: string;
  address?: {
    street: string;
    zipCode: string;
    city: string;
    state: string;
    country: string;
    address2?: string;
  };
  locationDescription?: string;
  active: boolean;
  ads?: Array<{
    id: string;
    orderIndex: number;
  }>;
}

export interface MonitorAdRequestDto {
  id: string;
  orderIndex?: number;
}
