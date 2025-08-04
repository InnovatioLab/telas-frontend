import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { catchError, map, of } from "rxjs";
import { ClientService } from "../api/client.service";
import { Authentication } from "../auth/autenthication";

export const MyTelasGuard: CanActivateFn = () => {
  const router = inject(Router);
  const clientService = inject(ClientService);
  const authentication = inject(Authentication);

  if (!authentication.isTokenValido()) {
    router.navigate(["/login"]);
    return false;
  }

  return clientService.getAuthenticatedClient().pipe(
    map((client) => {
      if (client.shouldDisplayAttachments === false) {
        router.navigate(["/client"]);
        return false;
      }
      return true;
    }),
    catchError((error) => {
      console.error("Error while getting logged client:", error);
      router.navigate(["/client"]);
      return of(false);
    })
  );
};
