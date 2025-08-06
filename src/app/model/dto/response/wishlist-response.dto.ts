export interface WishlistResponseDto {
  id: string;
  monitors: MonitorWishlistResponseDto[];
}

export interface MonitorWishlistResponseDto {
  id: string;
  active: boolean;
  type: TMonitorType;
  locationDescription: string;
  size: number;
  fullAddress: string;
  latitude: number;
  longitude: number;
  hasAvailableSlots: boolean;
  estimatedSlotReleaseDate: string | null;
}

type TMonitorType = "BASIC" | "PREMIUM";
