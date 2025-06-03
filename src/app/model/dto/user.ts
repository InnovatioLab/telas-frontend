export class User {
  id?: string;
  login?: string;
  tipoPerfil?: string;
  nome?: string;

  static setDadosCadastroLocal(tipo: string, firebaseUID?: string) {
    localStorage.setItem('dadosCadastroLocal', JSON.stringify({ tipo, firebaseUID }));
  }

  static getDadosCadastroLocal(): string {
    if (!localStorage.getItem('dadosCadastroLocal')) {
      return undefined;
    }

    return localStorage.getItem('dadosCadastroLocal');
  }

}
