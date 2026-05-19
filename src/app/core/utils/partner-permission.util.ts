import { Role } from "@app/model/client";

export const PARTNER_FOREIGN_MONITOR_BLOCK_QUANTITY = 5;

export interface PartnerPlatformQuotaClient {
  role?: Role | string;
  partnerSlotsAnyLocationEnabled?: boolean;
}

export function hasPartnerGlobalSlotsPermission(
  client: PartnerPlatformQuotaClient | null | undefined
): boolean {
  return client?.role === Role.PARTNER && !!client.partnerSlotsAnyLocationEnabled;
}

export function resolvePartnerCartBlockQuantity(
  client: PartnerPlatformQuotaClient | null | undefined
): number {
  return hasPartnerGlobalSlotsPermission(client)
    ? PARTNER_FOREIGN_MONITOR_BLOCK_QUANTITY
    : 1;
}
