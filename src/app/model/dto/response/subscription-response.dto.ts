import { Recurrence } from "@app/model/enums/recurrence.enum";
import { SubscriptionStatus } from "@app/model/enums/subscription-status.enum";
import { MonitorType } from "@app/model/monitors";
import { PaymentResponseDto } from "./payment-response.dto";

export interface SubscriptionResponseDto {
  id: string;
  amount: number;
  recurrence: Recurrence;
  bonus: boolean;
  status: SubscriptionStatus;
  startedAt?: string;
  endsAt?: string;
  daysLeft: number;
  payments: PaymentResponseDto[];
  monitors: SubscriptionMonitorResponseDto[];
}

export interface SubscriptionMinResponseDto {
  id: string;
  amount: number;
  recurrence: Recurrence;
  bonus: boolean;
  status: SubscriptionStatus;
  startedAt?: string;
  endsAt?: string;
  daysLeft: number;
  ableToUpgrade: boolean;
  ableToRenew: boolean;
  monitors: SubscriptionMonitorResponseDto[];
}

export interface SubscriptionMonitorResponseDto {
  id: string;
  type: MonitorType;
  size: number;
  addressData: string;
}
