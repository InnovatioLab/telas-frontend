import { DisplayType } from "@app/model/enums/display-type.enum";
import { MonitorType } from "@app/model/monitors";
import { AddressRequestDTO } from "./client-request.dto";

export interface CreateMonitorRequestDto {
  size: number;
  locationDescription?: string;
  address: AddressRequestDTO;
}

export interface UpdateMonitorRequestDto {
  size: number;
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
  type: MonitorType;
  active: boolean;
  ads?: Array<{
    id: string;
    orderIndex: number;
  }>;
}

export interface MonitorAdRequestDto {
  id: string;
  displayType: DisplayType;
  orderIndex: number;
}