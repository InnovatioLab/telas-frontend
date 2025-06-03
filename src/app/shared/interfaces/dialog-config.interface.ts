export interface IConfigDialogo {
  titulo?: string | 'Alerta!' | 'Sucesso!' | 'Erro!';
  descricao?: string;
  icon?: string | 'check_circle' | 'report';
  acaoPrimaria?: string;
  acaoSecundaria?: string;
  acaoPrimariaCallback?: () => void;
  acaoSecundariaCallback?: () => void;
}
