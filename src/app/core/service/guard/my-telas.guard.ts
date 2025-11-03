import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { catchError, map, of } from "rxjs";
import { take } from "rxjs/operators";
import { ClientService } from "../api/client.service";

export const MyTelasGuard: CanActivateFn = () => {
  const router = inject(Router);
  const clientService = inject(ClientService);

  return clientService.clientAtual$.pipe(
    take(1),
    map((client) => {
      if (client && !(client as any).shouldDisplayAttachments) {
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
