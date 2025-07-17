import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[uiAlphanumericOnly]',
  standalone: true
})
export class AlphanumericOnlyDirective {
  private readonly regex = new RegExp(/^[\p{L}0-9\s]+$/u);
  private readonly specialKeys = ['Backspace', 'Space', 'Tab', 'End', 'Home'];

  constructor(private readonly el: ElementRef) {}

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (this.specialKeys.indexOf(event.key) !== -1) {
      return;
    }

    const valorAtual =
      this.el.nativeElement?.value !== undefined
        ? this.el.nativeElement.value
        : this.el.nativeElement.querySelector('input').value;
    const novoValor = valorAtual.concat(event.key);

    if (novoValor && !this.regex.exec(String(novoValor))) {
      event.preventDefault();
    }
  }

  @HostListener('input', ['$event'])
  onInputChange(event: Event) {
    const input =
      this.el.nativeElement.value !== undefined ? this.el.nativeElement : this.el.nativeElement.querySelector('input');
    const valorAtual = input.value;
    const novoValor = valorAtual
      .split('')
      .filter((char: string) => this.regex.test(char))
      .join('');

    if (valorAtual !== novoValor) {
      input.value = novoValor;
      event.stopPropagation();
    }
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent) {
    event.preventDefault();
    const clipboardData: DataTransfer =
      event.clipboardData || (window as unknown as { clipboardData: DataTransfer }).clipboardData;
    const pastedText = clipboardData.getData('text');
    const cleanedText = pastedText
      .split('')
      .filter(char => this.regex.test(char))
      .join('');
    const input =
      this.el.nativeElement.value !== undefined ? this.el.nativeElement : this.el.nativeElement.querySelector('input');
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const value = input.value;
    input.value = value.slice(0, start) + cleanedText + value.slice(end);
    input.setSelectionRange(start + cleanedText.length, start + cleanedText.length);
    event.stopPropagation();
  }
}
