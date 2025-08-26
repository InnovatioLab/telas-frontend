import { Notification } from "../notification";

export class NotificationResponse {
  id: string;
  message: string;
  actionUrl?: string;
  visualized: boolean;

  constructor(data: INotificationResponse) {
    this.id = data.id;
    this.message = data.message;
    this.actionUrl = data.actionUrl;
    this.visualized = data.visualized;
  }

  static filtrarListaLidas(
    notificacoes: NotificationResponse[]
  ): Notification[] {
    const lista: Notification[] = [];
    notificacoes.forEach((notificacao) => {
      if (notificacao.visualized) {
        lista.push(
          new Notification({
            id: notificacao.id,
            message: notificacao.message,
            actionUrl: notificacao.actionUrl,
            visualized: notificacao.visualized,
          })
        );
      }
    });

    return lista;
  }

  static filtrarListaNaoLidas(
    notificacoes: NotificationResponse[]
  ): Notification[] {
    const lista: Notification[] = [];
    notificacoes.forEach((notificacao) => {
      if (!notificacao.visualized) {
        lista.push(
          new Notification({
            id: notificacao.id,
            actionUrl: notificacao.actionUrl,
            message: notificacao.message,
            visualized: notificacao.visualized,
          })
        );
      }
    });

    return lista;
  }
}

export interface INotificationResponse {
  id: string;
  message: string;
  visualized: boolean;
  actionUrl?: string;
}
