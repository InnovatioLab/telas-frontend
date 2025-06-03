import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[uiSenha]',
  standalone: true
})
export class SenhaDirective {
  @Input() permitirColar = true;
  private readonly regex = new RegExp(/^[^\s]+$/);
  private readonly specialKeys = ['Backspace', 'Tab', 'End', 'Home'];
 
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
    if (this.permitirColar) {
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
      input.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      event.preventDefault();
    }
  }
}
