export interface AdminAdOperationsFilter {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: string;
  genericFilter?: string;
  validation?: string;
}

export interface AdminAdOperationRow {
  adId: string;
  adName: string;
  validation: string;
  advertiserId: string;
  advertiserBusinessName: string;
  partnerId: string;
  partnerBusinessName: string;
  screenAddressSummary: string;
  monitorId: string;
  boxIp: string | null;
  subscriptionEndsAt: string | null;
  subscriptionStatus: string | null;
  operationalStage: string;
  urgencyLevel: AdminUrgencyLevel;
  daysUntilExpiry: number | null;
}

export type AdminUrgencyLevel = "NEUTRAL" | "GREEN" | "YELLOW" | "RED";

export interface AdminExpiryNotification {
  reference: string;
  createdAt: string;
  label: string;
}
