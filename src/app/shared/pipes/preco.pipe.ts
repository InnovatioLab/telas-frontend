import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatarPreco',
  standalone: true
})
export class FormatarPreco implements PipeTransform {
  transform(value: number): string {
    if (value === null || value === undefined) {
      return '';
    }
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
}
