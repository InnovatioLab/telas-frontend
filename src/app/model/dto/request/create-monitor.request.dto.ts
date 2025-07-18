import { AddressRequestDTO } from "./client-request.dto";
import { DisplayType } from "@app/model/enums/display-type.enum";
import { MonitorType } from "@app/model/monitors";

export interface CreateMonitorRequestDto {
  size: number;
  locationDescription?: string;
  address: AddressRequestDTO;
}

export interface UpdateMonitorRequestDto {
  size: number;
  addressId?: string;
  address: {
    id?: string;
    street: string;
    zipCode: string;
    city: string;
    state: string;
    country: string;
    complement?: string;
    latitude?: number;
    longitude?: number;
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