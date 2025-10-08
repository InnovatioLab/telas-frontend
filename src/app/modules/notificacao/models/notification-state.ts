import { effect, Injectable, signal } from "@angular/core";
import { Authentication } from "@app/core/service/auth/autenthication";
import { Client } from "@app/model/client";
import { map, Observable } from "rxjs";

import { NotificationService } from "../service/notification.service";
import { Notification } from "./notification";

@Injectable({ providedIn: "root" })
export class NotificationState {
  _notificacaoState = signal<Notification[] | null>(null);
  _visibilidadeSignal = signal<boolean | undefined>(false);
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
        map((notificacoes: Notification[]) => {
          this._notificacaoState.set(notificacoes);
          return notificacoes;
        })
      );
  }

  marcarComoLida(notificacaoID: string) {
    return this.notificationService.marcarComoLida(notificacaoID);
  }

  listarLidas(): Observable<Notification[]> {
    return this.notificationService.listarLidas().pipe(
      map((notificacoes: Notification[]) => {
        this._notificacaoState.set(notificacoes);
        return notificacoes;
      })
    );
  }

  listarNaoLidas(): Observable<Notification[]> {
    return this.notificationService.listarNaoLidas().pipe(
      map((notificacoes: Notification[]) => {
        const safeList = Array.isArray(notificacoes) ? notificacoes : [];
        this._quantidadeNotificacoes.set(safeList.length);
        this._notificacaoState.set(safeList);
        return safeList;
      })
    );
  }

  exibirSidebar() {
    this._visibilidadeSignal.set(true);
  }

  fecharSidebar() {
    this._visibilidadeSignal.set(false);
  }
}
