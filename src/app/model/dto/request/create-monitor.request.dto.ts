import { AddressRequestDTO } from "./client-request.dto";
import { DisplayType } from "@app/model/enums/display-type.enum";

export interface CreateMonitorRequestDto {
  size: number;
  address: AddressRequestDTO;
}

export interface MonitorAdRequestDto {
  id: string;
  displayType: DisplayType;
  orderIndex: number;
}