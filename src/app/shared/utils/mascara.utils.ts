export class MascaraUtils {
  public static readonly aplicarMascara = (valor: string, mascara?: string): string => {
    if (valor === undefined) {
      return undefined;
    }

    if (!valor) {
      return '';
    }

    const numero = valor.replace(/\D/g, '');

    const celularComNonoDigito = numero.length === 11;
    const mascaraAplicar = mascara
      ?? (celularComNonoDigito ? '(99) 9 9999-9999' : '(99) 9999-9999');

    let resultado = '';
    let valorIndex = 0;

    for (const char of mascaraAplicar) {
      if (char === '9' && valorIndex < numero.length) {
        resultado += numero[valorIndex];
        valorIndex++;
      } else if (char !== '9') {
        resultado += char;
      }
    }

    return resultado;
  };
}
