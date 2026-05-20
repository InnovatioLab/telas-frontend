import { Role } from "@app/model/client";
import { canAdminCreatePartner } from "./admin-partner.util";

describe("canAdminCreatePartner", () => {
  it("returns true for developer", () => {
    expect(
      canAdminCreatePartner({ role: Role.DEVELOPER, adminCanCreatePartnerEnabled: false })
    ).toBe(true);
  });

  it("returns setting value for admin", () => {
    expect(
      canAdminCreatePartner({ role: Role.ADMIN, adminCanCreatePartnerEnabled: true })
    ).toBe(true);
    expect(
      canAdminCreatePartner({ role: Role.ADMIN, adminCanCreatePartnerEnabled: false })
    ).toBe(false);
  });

  it("returns false for other roles", () => {
    expect(
      canAdminCreatePartner({ role: Role.CLIENT, adminCanCreatePartnerEnabled: true })
    ).toBe(false);
  });
});
