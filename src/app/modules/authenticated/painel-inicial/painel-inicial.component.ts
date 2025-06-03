import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseModule } from '@app/shared/base/base.module';
import { LayoutComponent } from '@app/shared/components/layout/layout.component';
import dayjs from 'dayjs';
import { AbstractControlUtils } from '@app/shared/utils/abstract-control.utils';
import { IColumn } from '@app/shared/utils/table.utils';
import { tabelaDistribuicaoDocsStyle } from '@app/shared/constants/tabela-coluna-style.constants';
import { IDocumentoDistribuicao } from '@app/model/dto/documento-distribuicao';
import { PainelInicialService } from '@app/core/service/painel-inicial.service';
import { CardContagem } from '@app/model/view/card-contagem';
import { PrimengModule } from '@app/shared/primeng/primeng.module';
import { TableComponent } from '@app/shared/components/table/table.component';
@Component({
    selector: 'app-painel-inicial',
    imports: [CommonModule, PrimengModule, BaseModule, LayoutComponent, TableComponent],
    templateUrl: './painel-inicial.component.html',
    styleUrls: ['./painel-inicial.component.scss']
})
export class PainelInicialComponent implements OnInit {
  primeiroRegistro = 0;
  columns: IColumn[] = [
    {
      header: 'Grupo',
      body: 'grupo',
      sortable: true,
      headerStyles: tabelaDistribuicaoDocsStyle.grupo,
      bodyInlineStyles: tabelaDistribuicaoDocsStyle.grupo
    },
    {
      header: 'Subgrupo',
      body: 'subGrupo',
      sortable: true,
      headerStyles: tabelaDistribuicaoDocsStyle.subgrupo,
      bodyInlineStyles: tabelaDistribuicaoDocsStyle.subgrupo,

    },
        {
      header: 'Quantidade de Documentos',
      body: 'quantidadeDocumentos',
      sortable: true,
      headerStyles: tabelaDistribuicaoDocsStyle.quantidadeDocumentos,
      bodyInlineStyles: tabelaDistribuicaoDocsStyle.quantidadeDocumentos
    },
  ]

  listaDistribuicao: IDocumentoDistribuicao[];
  listaCompleta: IDocumentoDistribuicao[];

  rows = 10;
  first = 0;
  sortField =''
  sortOrder ='desc'
  totalRegistros = 0;

  ultimaAtualizacao = AbstractControlUtils.formatarDataHoraBR(dayjs().toString())
  @ViewChild(TableComponent) tableComponente: TableComponent;

  constructor(
    private readonly painelInicialService: PainelInicialService,
  ) {}

  ngOnInit(): void {
    this.obtemDadosDistribuicao();
  }

  obtemDadosDistribuicao(): void {
    this.painelInicialService.pegaDistribuicaoDocumentos().subscribe({
      next: (response) => {
        this.listaCompleta = [...response];
        this.totalRegistros = this.listaCompleta.length;
        this.ultimaAtualizacao = AbstractControlUtils.formatarDataHoraBR(dayjs().toString());
        this.first = 0;
        this.atualizaTabela();
      },
    });
  }

  get cardsContagem(): CardContagem[] {
    return [
      { legenda: 'Arquivos Cadastrados', contagem: this.obterTotalDocumentos()},
      { legenda: 'Grupos Cadastrados', contagem: this.obterTotalGrupos() },
      { legenda: 'Subgrupos Cadastrados', contagem: this.obterTotalSubGrupos() },
    ];
  }

  obterTotalGrupos(): number {
    if (!this.listaDistribuicao) return 0
    const grupos = this.listaDistribuicao.map(item => item.grupo);
    return new Set(grupos).size;
  }

  obterTotalSubGrupos(): number {
    if (!this.listaDistribuicao) return 0
    const subGrupos = this.listaDistribuicao.map(item => item.subGrupo);
    return new Set(subGrupos).size;
  }

  obterTotalDocumentos(): number {
    if (!this.listaDistribuicao) return 0
    return this.listaDistribuicao.reduce((total, item) => total + item.quantidadeDocumentos, 0);
  }

  atualizaTabela(): void {
    const listaOrdenada = [...this.listaCompleta];

    if (this.sortField) {
      listaOrdenada.sort((a: any, b: any) => {
        const valorA = a[this.sortField];
        const valorB = b[this.sortField];

        if (valorA == null) return 1;
        if (valorB == null) return -1;

        const resultado = String(valorA).localeCompare(String(valorB), undefined, { numeric: true });

        return this.sortOrder === 'asc' ? resultado : -resultado;
      });
    }

    const start = this.first;
    const end = this.first + this.rows;
    this.listaDistribuicao = listaOrdenada.slice(start, end);
  }


  onPageChange(event: { first?:number, page: number; rows: number; sortField?: string; sortOrder?: string }) {
    this.first = (event.page - 1) * event.rows;
    this.rows = event.rows;
    this.primeiroRegistro = event.first;
    this.sortField = event.sortField??this.sortField;
    this.sortOrder = event.sortOrder??this.sortOrder;
    this.atualizaTabela();
  }
}
