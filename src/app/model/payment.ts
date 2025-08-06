import { PaymentStatus } from "./enums/payment-status.enum";
import { Subscription } from "./subscription";

export interface Payment {
  id: string;
  amount: number;
  paymentMethod: string;
  currency: string;
  status: PaymentStatus;
  subscription?: Subscription;
}
