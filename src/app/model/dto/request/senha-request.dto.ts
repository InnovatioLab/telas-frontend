import { ErrorHandler } from '@angular/core';

export class SenhaRequestDto {
  senha: string;
  confirmacaoSenha: string;

  constructor(senha: string, confirmacaoSenha: string) {
    const isValido = this.validarSenhasIguais(senha, confirmacaoSenha);

    if (!isValido) {
      throw new ErrorHandler().handleError('Senhas não conferem');
    }

    this.senha = senha;
    this.confirmacaoSenha = confirmacaoSenha;
  }

  validarSenhasIguais(senha: string, confirmacaoSenha: string): boolean {
    if (senha !== confirmacaoSenha) {
      return false;
    }

    return true;
  }
}
