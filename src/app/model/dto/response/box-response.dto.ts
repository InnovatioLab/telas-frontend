export interface BoxAddressDto {
  id: string;
  mac: string;
  ip: string;
}

export interface MonitorDto {
  id: string;
  active: boolean;
  maxBlocks: number;
}

export interface BoxResponseDto {
  id: string;
  active: boolean;
  boxAddress: BoxAddressDto;
  monitors: MonitorDto[];
}
