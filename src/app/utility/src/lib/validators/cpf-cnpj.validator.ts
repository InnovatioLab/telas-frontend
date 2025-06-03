import { AbstractControl } from '@angular/forms';

import { cpf as cpfValidator, cnpj as cnpjValidator } from 'cpf-cnpj-validator';

export function validatorCpfCnpj(control: AbstractControl): { [key: string]: string } | null {
  if (control.value) {
    const value = getOnlyNumber(control.value);
    if (value.length == 5) return null;

    if (value.length == 11) {
      return cpfValidator.isValid(value) ? null : { cpfInvalido: 'CPF ou CNPJ inválido!' };
    } else if (value.length == 14) {
      return cnpjValidator.isValid(value) ? null : { cnpjInvalido: 'CPF ou CNPJ inválido!' };
    }
    return null;
  }
  return null;
}

export function validatorCpf(control: AbstractControl): { [key: string]: string } | null {
  if (control.value) {
    const value = getOnlyNumber(control.value);
    if(value.length < 11) return { cpfInvalido: 'CPF inválido!' };

    if (value.length == 11) {
      return cpfValidator.isValid(value) ? null : { cpfInvalido: 'CPF inválido!' };
    }
    return null;
  }
  return null;
}

export function validatorCnpj(control: AbstractControl): { [key: string]: string } | null {
  if (control.value) {
    const value = getOnlyNumber(control.value);
    if (value.length <= 14) {
      return cnpjValidator.isValid(value) ? null : { cnpjInvalido: 'CNPJ inválido!' };
    }
    return null;
  }
  return null;
}

export function getOnlyNumber(value: string): string {
  return value.replace(/\D/g, '');
}
