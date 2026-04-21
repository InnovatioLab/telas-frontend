export interface CreateMonitorRequestDto {
  locationDescription?: string;
  addressId: string;
}

export interface UpdateMonitorRequestDto {
  addressId: string;
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
