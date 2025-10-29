import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { catchError, map, of } from "rxjs";
import { switchMap, take } from "rxjs/operators";
import { ClientService } from "../api/client.service";

export const MyTelasGuard: CanActivateFn = () => {
  const router = inject(Router);
  const clientService = inject(ClientService);

  return clientService.clientAtual$.pipe(
    take(1),
    switchMap((client) =>
      client ? of(client) : clientService.getAuthenticatedClient()
    ),
    map((client) => {
      if ((client as any).shouldDisplayAttachments === false) {
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
