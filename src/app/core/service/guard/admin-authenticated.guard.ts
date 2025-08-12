import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { Role } from "@app/model/client";
import { Authentication } from "../auth/autenthication";

export const AdminAuthenticatedGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authentication = inject(Authentication);

  if (!authentication.isTokenValido()) {
    router.navigate(["/login"]);
    return false;
  }

  const client = authentication._clientSignal();
  const userRole = client?.role;

  if (userRole !== Role.ADMIN) {
    router.navigate(["/client"]);
    return false;
  }

  return true;
};
