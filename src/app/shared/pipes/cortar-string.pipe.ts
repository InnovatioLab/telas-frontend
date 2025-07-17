import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'cortarString',
  standalone: true
})
export class CortarStringPipe implements PipeTransform {
  transform(texto: string, limite: number): string {
    const tamanhoAlias = 3;
    const novoLimite = limite - tamanhoAlias;

    if (!texto) return '';

    if (texto.length < limite) {
      return texto;
    }

    return texto.slice(0, novoLimite) + '...';
  }
}
