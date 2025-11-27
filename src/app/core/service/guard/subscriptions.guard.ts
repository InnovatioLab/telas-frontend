import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { catchError, map, of, shareReplay } from "rxjs";
import { switchMap, take, tap } from "rxjs/operators";
import { ClientService } from "../api/client.service";

export const SubscriptionsGuard: CanActivateFn = () => {
  const router = inject(Router);
  const clientService = inject(ClientService);

  return clientService.clientAtual$.pipe(
    take(1),
    switchMap((client) =>
      client ? of(client) : clientService.getAuthenticatedClient()
    ),
    map((client) => {
      if ((client as any).hasSubscription === false) {
        return false;
      }
      return true;
    }),
    tap((canActivate) => {
      if (!canActivate) {
        router.navigate(["/client"]);
      }
    }),
    catchError((error) => {
      router.navigate(["/client"]);
      return of(false);
    }),
    shareReplay(1)
  );
};
