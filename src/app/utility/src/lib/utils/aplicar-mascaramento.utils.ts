export class AplicarMascaramentoUtils {
  static aplicarMascaraDocumento(documento: string): string {
    if (!documento) return "";

    const tamanhoDocumento = documento.length;

    const cpfTamanho = 11;
    const cnpjTamanho = 14;

    if (tamanhoDocumento === cpfTamanho) {
      return this.aplicarMascara(documento, "999.999.999-99");
    } else if (tamanhoDocumento === cnpjTamanho) {
      return this.aplicarMascara(documento, "99.999.999/9999-99");
    }

    return documento;
  }

  private static aplicarMascara(valor: string, mascara: string): string {
    let resultado = "";
    let indiceMascara = 0;
    let indiceValor = 0;

    while (indiceMascara < mascara.length && indiceValor < valor.length) {
      if (mascara[indiceMascara] === "9") {
        resultado += valor[indiceValor];
        indiceValor++;
      } else {
        resultado += mascara[indiceMascara];
      }
      indiceMascara++;
    }

    return resultado;
  }
}
