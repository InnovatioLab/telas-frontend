export interface Box {
  id: string;
  ip: string;
  macAddress?: string;
  boxAddressId?: string;
  monitorIds: string[];
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  monitorCount?: number;
}
