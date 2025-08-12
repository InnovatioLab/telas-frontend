import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { catchError, map, of } from "rxjs";
import { ClientService } from "../api/client.service";

export const SubscriptionsGuard: CanActivateFn = () => {
  const router = inject(Router);
  const clientService = inject(ClientService);

  return clientService.getAuthenticatedClient().pipe(
    map((client) => {
      if (client.hasSubscription === false) {
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
