import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'quebraLinha'
})
export class QuebraLinhaPipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return '';
    return value.replace(/\n/g, '<br/>');
  }
}
