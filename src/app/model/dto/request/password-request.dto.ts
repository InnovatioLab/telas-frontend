import { ErrorHandler } from '@angular/core';

export class PasswordRequestDto {
  password: string;
  confirmPassword: string;

  constructor(password: string, confirmPassword: string) {
    const isValido = this.validarSenhasIguais(password, confirmPassword);

    if (!isValido) {
      throw new ErrorHandler().handleError('Senhas não conferem');
    }

    this.password = password;
    this.confirmPassword = confirmPassword;
  }

  validarSenhasIguais(password: string, confirmPassword: string): boolean {
    if (password !== confirmPassword) {
      return false;
    }

    return true;
  }
}
