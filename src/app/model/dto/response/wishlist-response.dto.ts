export interface WishlistResponseDto {
  id: string;
  monitors: MonitorWishlistResponseDto[];
}

export interface MonitorWishlistResponseDto {
  id: string;
  active: boolean;
  photoUrl?: string;
  addressLocationName?: string;
  addressLocationDescription?: string;
  fullAddress: string;
  latitude: number;
  longitude: number;
  hasAvailableSlots: boolean;
  estimatedSlotReleaseDate: string | null;
}
