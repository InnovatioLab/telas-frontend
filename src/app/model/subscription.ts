import { Client } from "./client";
import { Recurrence } from "./enums/recurrence.enum";
import { SubscriptionStatus } from "./enums/subscription-status.enum";
import { Monitor } from "./monitors";
import { Payment } from "./payment";

export interface Subscription {
  id: string;
  recurrence: Recurrence;
  stripeId?: string;
  bonus: boolean;
  status: SubscriptionStatus;
  upgrade?: boolean;
  client?: Client;
  payments: Payment[];
  monitors: Monitor[];
  startedAt?: string;
  endsAt?: string;
}
