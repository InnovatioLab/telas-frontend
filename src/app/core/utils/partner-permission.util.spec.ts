import { Role } from "@app/model/client";
import { PartnerPermission } from "@app/model/partner-permission";
import {
  hasPartnerGlobalSlotsPermission,
  resolvePartnerCartBlockQuantity,
} from "./partner-permission.util";

describe("partner-permission.util", () => {
  it("returns false without explicit grant", () => {
    expect(
      hasPartnerGlobalSlotsPermission({ role: Role.PARTNER, permissions: [] })
    ).toBe(false);
  });

  it("returns true with PARTNER_SLOTS_ANY_LOCATION", () => {
    expect(
      hasPartnerGlobalSlotsPermission({
        role: Role.PARTNER,
        permissions: [PartnerPermission.PARTNER_SLOTS_ANY_LOCATION],
      })
    ).toBe(true);
  });

  it("resolves cart block quantity to 5 for permitted partner", () => {
    expect(
      resolvePartnerCartBlockQuantity({
        role: Role.PARTNER,
        permissions: [PartnerPermission.PARTNER_SLOTS_ANY_LOCATION],
      })
    ).toBe(5);
  });

  it("resolves cart block quantity to 1 for regular client", () => {
    expect(resolvePartnerCartBlockQuantity({ role: Role.CLIENT, permissions: [] })).toBe(
      1
    );
  });
});
