import { Recurrence } from "@app/model/enums/recurrence.enum";
import { SubscriptionStatus } from "@app/model/enums/subscription-status.enum";
import { PaymentResponseDto } from "./payment-response.dto";
import { MonitorType } from "@app/model/monitors";

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
  monitors: SubscriptionMonitorResponseDto[];
}

export interface SubscriptionMonitorResponseDto {
  id: string;
  type: MonitorType;
  size: number;
  addressData: string;
}
