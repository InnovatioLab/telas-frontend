import { Notificacao } from '../notificacao';

export class NotificacaoResponse {
  id: string;
  referencia: string;
  mensagem: string;
  visualizada: boolean;

  constructor(dados: INotificacaoResponse) {
    this.id = dados.id;
    this.referencia = dados.referencia;
    this.mensagem = dados.mensagem;
    this.visualizada = dados.visualizada;
  }

  static filtrarListaLidas(notificacoes: NotificacaoResponse[]): Notificacao[] {
    const lista: Notificacao[] = [];
    notificacoes.forEach(notificacao => {
      if (notificacao.visualizada) {
        lista.push(
          new Notificacao({
            id: notificacao.id,
            referencia: notificacao.referencia,
            mensagem: notificacao.mensagem,
            visualizada: notificacao.visualizada
          })
        );
      }
    });

    return lista;
  }

  static filtrarListaNaoLidas(notificacoes: NotificacaoResponse[]): Notificacao[] {
    const lista: Notificacao[] = [];
    notificacoes.forEach(notificacao => {
      if (!notificacao.visualizada) {
        lista.push(
          new Notificacao({
            id: notificacao.id,
            referencia: notificacao.referencia,
            mensagem: notificacao.mensagem,
            visualizada: notificacao.visualizada
          })
        );
      }
    });

    return lista;
  }
}

export interface INotificacaoResponse {
  id: string;
  referencia: string;
  mensagem: string;
  visualizada: boolean;
  link: string;
}
