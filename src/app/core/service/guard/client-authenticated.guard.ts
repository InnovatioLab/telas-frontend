import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { Role } from "@app/model/client";
import { Authentication } from "../auth/autenthication";

export const ClientAuthenticatedGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authentication = inject(Authentication);

  if (!authentication.isTokenValido()) {
    router.navigate(["/login"]);
    return false;
  }

  const userRole = authentication._clientSignal()?.role;

  if (userRole === Role.ADMIN) {
    router.navigate(["/admin"]);
    return false;
  }

  return true;
};
