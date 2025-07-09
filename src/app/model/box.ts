export interface Box {
  id: string;
  ip: string;
  monitorIds: string[];
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  monitorCount?: number;
}
