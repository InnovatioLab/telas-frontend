import { Type } from '@angular/core';

export interface IConfigDialogo {
  titulo?: string;
  descricao?: string;
  icon?: string | Type<any>;
  acaoPrimaria?: string;
  acaoSecundaria?: string;
  acaoPrimariaCallback?: () => void;
  acaoSecundariaCallback?: () => void;
}
