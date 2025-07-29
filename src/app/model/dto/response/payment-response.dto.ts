import { PaymentStatus } from "@app/model/enums/payment-status.enum";

export interface PaymentResponseDto {
  id: string;
  amount: number;
  paymentMethod: string;
  currency: string;
  status: PaymentStatus;
}
