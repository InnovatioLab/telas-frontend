import { effect, Injectable, signal } from '@angular/core';
import { Notificacao } from './notificacao';
import { NotificacaoService } from '../service/notificacao.service';
import { map, Observable } from 'rxjs';
import { Client } from '@app/model/client';
import { Authentication } from '@app/core/service/autenthication';

@Injectable({ providedIn: 'root' })
export class NotificacaoState {
  _notificacaoState = signal<Notificacao[] | null>(null);
  _visibilidadeSignal = signal<boolean | undefined>(false);
  _quantidadeNotificacoes = signal<number>(0);
  private readonly previousUserSignal = signal<Client | null>(null);

  constructor(
    private readonly notificacaoService: NotificacaoService,
    private readonly authentication: Authentication
  ) {
    effect(
      () => {
        const previousUser = this.previousUserSignal();
        const currentClient = this.authentication.client();

        if (previousUser?.id !== currentClient?.id) {
          this.previousUserSignal.set(currentClient);

          if (currentClient) {
            this.listarNaoLidas()
          }

        } else {
          this.listarNaoLidas()
        }
      },
      { allowSignalWrites: true }
    );
  }

  marcarTodasComoLidas(arrNotificacoesID: string[]): Observable<Notificacao[]> {
    return this.notificacaoService.marcarTodasComoLidas(arrNotificacoesID).pipe(map(
      (notificacoes: Notificacao[]) => {
        this._notificacaoState.set(notificacoes);
        return notificacoes;
      })
    );
  }

  marcarComoLida(notificacaoID: string) {
    return this.notificacaoService.marcarComoLida(notificacaoID)
  }

  listarLidas(): Observable<Notificacao[]> {
    return this.notificacaoService.listarLidas().pipe(map(
      (notificacoes: Notificacao[]) => {
        this._notificacaoState.set(notificacoes);
        return notificacoes;
      })
    );
  }

  listarNaoLidas(): Observable<Notificacao[]> {
    return this.notificacaoService.listarNaoLidas().pipe(
      map((notificacoes: Notificacao[]) => {
        this._quantidadeNotificacoes.set(notificacoes.length);
        this._notificacaoState.set(notificacoes);
        return notificacoes;
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
