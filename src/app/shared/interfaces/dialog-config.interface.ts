import { Type } from '@angular/core';

export interface IConfigDialogo {
  titulo?: string;
  descricao?: string;
  icon?: string | Type<any>;
  iconClass?: string;
  acaoPrimaria?: string;
  acaoSecundaria?: string;
  acaoPrimariaCallback?: () => void;
  acaoSecundariaCallback?: () => void;
}
