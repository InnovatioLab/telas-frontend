import { Injectable } from "@angular/core";
import { Resolve } from "@angular/router";
import { Authentication } from "@app/core/service/auth/autenthication";
import { catchError, map, Observable, of } from "rxjs";
import { Notification, NotificationState } from "../models";

@Injectable({
  providedIn: "root",
})
export class NotificacaoResolver implements Resolve<string | null> {
  constructor(
    private notificationState: NotificationState,
    private authentication: Authentication
  ) {}

  resolve(): Observable<string | null> {
    if (!this.authentication._clientSignal()) {
      return null;
    }

    return this.notificationState.listarNaoLidas().pipe(
      map((response: Notification[]) => {
        if (response && response.length > 0) {
          return response.toString();
        } else {
          return null;
        }
      }),
      catchError(() => {
        return of(null);
      })
    );
  }
}
