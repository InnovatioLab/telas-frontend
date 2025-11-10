import { Recurrence } from "@app/model/enums/recurrence.enum";

export interface CartResponseDto {
  id: string;
  active: boolean;
  recurrence: Recurrence;
  items: CartItemResponseDto[];
}

export interface CartItemResponseDto {
  id: string;
  monitorId: string;
  blockQuantity: number;
  monitorAddress: string;
  latitude: number;
  longitude: number;
  photoUrl?: string;
  addressLocationName?: string;
  addressLocationDescription?: string;
}
