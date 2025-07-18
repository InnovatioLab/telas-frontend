export class Notificacao {
  id: string;
  referencia: string;
  mensagem: string;
  visualizada?: boolean;
  link?: string;

  constructor(dados: INotificacao) {
    this.id = dados.id;
    this.referencia = dados.referencia;
    this.mensagem = dados.mensagem;
    this.visualizada = dados.visualizada;
    this.link = dados.link;
  }
}

export interface INotificacao {
  id: string;
  referencia: string;
  mensagem: string;
  visualizada?: boolean;
  link?: string;
}
