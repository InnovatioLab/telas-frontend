import { Recurrence } from "@app/model/enums/recurrence.enum";

export interface CartRequestDto {
  recurrence: Recurrence;
  items: CartItemRequestDto[];
}

export interface CartItemRequestDto {
  monitorId: string;
  blockQuantity: number;
}