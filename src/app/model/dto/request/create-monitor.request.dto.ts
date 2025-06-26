import { MonitorType } from "@app/model/monitors";
import { AddressRequestDTO } from "./client-request.dto";
import { DisplayType } from "@app/model/enums/display-type.enum";

export interface CreateMonitorRequestDto {
  productId?: string;
  size?: number;
  address?: AddressRequestDTO;
  maxBlocks?: number;
  locationDescription?: string;
  type: MonitorType;
  active: boolean;
  ads?: MonitorAdRequestDto[];
}

export interface MonitorAdRequestDto {
  id: string;
  displayType: DisplayType;
  orderIndex: number;
}