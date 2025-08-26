export class Notification {
  id: string;
  message: string;
  actionUrl?: string;
  visualized: boolean;

  constructor(dados: INotification) {
    this.id = dados.id;
    this.message = dados.message;
    this.visualized = dados.visualized;
    this.actionUrl = dados.actionUrl;
  }
}

export interface INotification {
  id: string;
  message: string;
  visualized?: boolean;
  actionUrl?: string;
}
