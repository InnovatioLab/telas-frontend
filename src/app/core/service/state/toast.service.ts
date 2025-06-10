import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

@Injectable({ providedIn: 'root' })
export class ToastService {
  constructor(private notificacaoService: MessageService) {}

  sucesso(mensagem: string, tempo = 3000) {
    this.notificacaoService.add({
      severity: 'success',
      summary: 'Sucesso',
      detail: mensagem,
      life: tempo
    });
  }

  erro(mensagem: string, tempo = 3000) {
    this.notificacaoService.add({
      severity: 'error',
      summary: 'Erro',
      detail: mensagem,
      life: tempo
    });
  }

  info(mensagem: string, tempo = 3000) {
    this.notificacaoService.add({
      severity: 'info',
      summary: 'Informação',
      detail: mensagem,
      life: tempo
    });
  }

  aviso(mensagem: string, tempo = 3000) {
    this.notificacaoService.add({
      severity: 'warn',
      summary: 'Aviso',
      detail: mensagem,
      life: tempo
    });
  }

  customizada(severity: string, summary: string, detail: string, life = 3000) {
    this.notificacaoService.add({ severity, summary, detail, life });
  }

  limpar() {
    this.notificacaoService.clear();
  }
}
