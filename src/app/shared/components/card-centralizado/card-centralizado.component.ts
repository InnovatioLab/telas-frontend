import { Component, ContentChildren, ElementRef, QueryList, TemplateRef, AfterContentInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimengModule } from '../../primeng/primeng.module';
import { PrimeTemplate } from 'primeng/api';

@Component({
  selector: 'app-card-centralizado',
  standalone: true,
  imports: [CommonModule, PrimengModule],
  templateUrl: './card-centralizado.component.html',
  styleUrl: './card-centralizado.component.scss'
})
export class CardCentralizadoComponent implements AfterContentInit {
  @ContentChildren(PrimeTemplate) templates: QueryList<PrimeTemplate> | undefined;

  contentTemplate: TemplateRef<Component> | undefined;

  @Input() type: string | 'formulario-grande' | 'formulario-pequeno' | 'formulario-login' | undefined;

  constructor(private readonly el: ElementRef) {}

  ngAfterContentInit() {
    this.templates?.forEach(item => {
      this.contentTemplate = item.template;
    });
  }

  exibirCardSemTipo() {
    return this.type !== 'formulario-grande' && this.type !== 'formulario-pequeno' && this.type !== 'formulario-login';
  }
}
