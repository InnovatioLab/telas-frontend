import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimengModule } from '../../primeng/primeng.module';

@Component({
  selector: 'app-button-footer',
  standalone: true,
  imports: [CommonModule, PrimengModule],
  templateUrl: './button-footer.component.html',
  styleUrl: './button-footer.component.scss'
})
export class ButtonFooterComponent {
  @Output() proximo = new EventEmitter();
  @Output() anterior = new EventEmitter();

  @Input() txtBtnAnterior: string;
  @Input() txtBtnProximo: string;
  @Input() habilitarConcluir: boolean;

  chamarAcaoProximo() {
    if (this.proximo) {
      this.proximo.emit();
    }
  }

  chamarAcaoAnterior() {
    if (this.anterior) {
      this.anterior.emit();
    }
  }
}
