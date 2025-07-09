export interface BoxResponseDto {
  id: string;
  ip: string;
  monitorIds: string[];
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
