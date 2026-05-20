import { Client, Role } from "@app/model/client";

export function canAdminCreatePartner(
  client: Pick<Client, "role" | "adminCanCreatePartnerEnabled"> | null | undefined
): boolean {
  if (!client?.role) {
    return false;
  }
  if (client.role === Role.DEVELOPER) {
    return true;
  }
  if (client.role === Role.ADMIN) {
    return !!client.adminCanCreatePartnerEnabled;
  }
  return false;
}
