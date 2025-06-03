import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimengModule } from '@app/shared/primeng/primeng.module';

@Component({
  selector: 'app-termos',
  standalone: true,
  imports: [CommonModule, PrimengModule],
  templateUrl: './termos.component.html',
  styleUrls: ['./termos.component.scss']
})
export class TermosComponent {
  @Output() isAceitouTermo = new EventEmitter<boolean>();

  aceitar() {
    this.isAceitouTermo.emit(true);
  }

  rejeitar() {
    this.isAceitouTermo.emit(false);
  }
}
