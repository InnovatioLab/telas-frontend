export interface BoxAddressDto {
  id: string;
  mac: string;
  ip: string;
}

export interface MonitorDto {
  id: string;
  active: boolean;
  type: string;
  maxBlocks: number;
}

export interface BoxResponseDto {
  id: string;
  active: boolean;
  boxAddress: BoxAddressDto;
  monitors: MonitorDto[];
}
