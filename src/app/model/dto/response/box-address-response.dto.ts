export interface BoxAddressResponseDto {
  id: string;
  mac: string;
  ip: string;
  dns?: string;
  inUse?: boolean;
}
