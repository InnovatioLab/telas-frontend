import { Pipe, PipeTransform } from '@angular/core';
import { MascaraUtils } from '../utils/mascara.utils';

@Pipe({
  name: 'formatarCpfCnpj',
  standalone: true
})
export class FormatarCpfCnpjPipe implements PipeTransform {
    transform(texto: string): string {
        const tamanhoTexto = texto?.length;
        const cpfTamanho = 11;
        const cnpjTamanho = 14;

        let resultado = '';

        if (tamanhoTexto === cpfTamanho) {
            resultado = MascaraUtils.aplicarMascara(texto, '999.999.999-99');
        }

        if (tamanhoTexto === cnpjTamanho) {
            resultado = MascaraUtils.aplicarMascara(texto, '99.999.999/9999-99');
        }

        return resultado;
    }
}
