import { Role } from "@app/model/client";
import {
  hasPartnerGlobalSlotsPermission,
  resolvePartnerCartBlockQuantity,
} from "./partner-permission.util";

describe("partner-permission.util", () => {
  it("returns false when global flag is off", () => {
    expect(
      hasPartnerGlobalSlotsPermission({
        role: Role.PARTNER,
        partnerSlotsAnyLocationEnabled: false,
      })
    ).toBe(false);
  });

  it("returns true when global flag is on for any partner", () => {
    expect(
      hasPartnerGlobalSlotsPermission({
        role: Role.PARTNER,
        partnerSlotsAnyLocationEnabled: true,
      })
    ).toBe(true);
  });

  it("resolves cart block quantity to 5 for all partners when global flag is on", () => {
    expect(
      resolvePartnerCartBlockQuantity({
        role: Role.PARTNER,
        partnerSlotsAnyLocationEnabled: true,
      })
    ).toBe(5);
  });

  it("resolves cart block quantity to 1 when global flag is off", () => {
    expect(
      resolvePartnerCartBlockQuantity({
        role: Role.PARTNER,
        partnerSlotsAnyLocationEnabled: false,
      })
    ).toBe(1);
  });
});
