import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { Authentication } from "@app/core/service/auth/autenthication";
import { isPartnerRole } from "@app/model/client";

export const redirectPartnerFromClientShoppingGuard: CanActivateFn = () => {
  const auth = inject(Authentication);
  const router = inject(Router);
  if (isPartnerRole(auth.client()?.role)) {
    return router.createUrlTree(["/partner/screens"]);
  }
  return true;
};

export const partnerScreensGuard: CanActivateFn = () => {
  const auth = inject(Authentication);
  const router = inject(Router);
  if (!isPartnerRole(auth.client()?.role)) {
    return router.createUrlTree(["/client"]);
  }
  return true;
};
