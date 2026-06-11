import { effect, Injectable, signal } from "@angular/core";
import { Authentication } from "@app/core/service/auth/autenthication";
import { Client } from "@app/model/client";
import { map, Observable } from "rxjs";

import { NotificationService } from "../service/notification.service";
import { Notification } from "./notification";

@Injectable({ providedIn: "root" })
export class NotificationState {
  _notificacaoState = signal<Notification[] | null>(null);
  _visibilitySignal = signal<boolean | undefined>(false);
  _quantidadeNotificacoes = signal<number>(0);
  private readonly previousUserSignal = signal<Client | null>(null);

  constructor(
    private readonly notificationService: NotificationService,
    private readonly authentication: Authentication
  ) {
    effect(
      () => {
        const previousUser = this.previousUserSignal();
        const currentClient = this.authentication.client();

        if (previousUser?.id !== currentClient?.id) {
          this.previousUserSignal.set(currentClient);

          if (currentClient) {
            this.listarNaoLidas();
          }
        } else {
          this.listarNaoLidas();
        }
      },
      { allowSignalWrites: true }
    );
  }

  marcarTodasComoLidas(
    arrNotificacoesID: string[]
  ): Observable<Notification[]> {
    return this.notificationService
      .marcarTodasComoLidas(arrNotificacoesID)
      .pipe(
        map((notifications: Notification[]) => {
          this._notificacaoState.set(notifications);
          return notifications;
        })
      );
  }

  marcarComoLida(notificacaoID: string) {
    return this.notificationService.marcarComoLida(notificacaoID);
  }

  listarLidas(): Observable<Notification[]> {
    return this.notificationService.listarLidas().pipe(
      map((notifications: Notification[]) => {
        this._notificacaoState.set(notifications);
        return notifications;
      })
    );
  }

  listarNaoLidas(): Observable<Notification[]> {
    return this.notificationService.listarNaoLidas().pipe(
      map((notifications: Notification[]) => {
        this._quantidadeNotificacoes.set(notifications.length);
        this._notificacaoState.set(notifications);
        return notifications;
      })
    );
  }

  exibirSidebar() {
    this._visibilitySignal.set(true);
  }

  fecharSidebar() {
    this._visibilitySignal.set(false);
  }
}
