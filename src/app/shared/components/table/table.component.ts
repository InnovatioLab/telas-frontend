import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SortEvent } from 'primeng/api';
import { Table } from 'primeng/table';
import { PaginatorState } from 'primeng/paginator';
import { IColumn, TableUtils } from '@app/shared/utils/table.utils';
import { IAcoes } from '@app/model/dto/acoes.interface';
import { IDocumentoDistribuicao } from '@app/model/dto/documento-distribuicao';
import { FormatarCpfCnpjPipe } from '@app/shared/pipes/formatar-cpf-cnpj.pipe';
import { CortarStringPipe } from '@app/shared/pipes/cortar-string.pipe';
import { PrimengModule } from '@app/shared/primeng/primeng.module';
import { Client } from '@app/model/client';
import { Monitor } from '@app/model/monitors';

export interface IPageEvent {
  first: number;
  rows: number;
  page: number;
  pageCount: number;
}

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [
    CommonModule,
    PrimengModule,
    FormsModule,
    FormatarCpfCnpjPipe,
    CortarStringPipe,

  ],
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss']
})
export class TableComponent {
  @ViewChild('table', { static: true }) dataTable: Table;
  @Input()
  set value(val: Array<Client | IDocumentoDistribuicao | Monitor>) {
    this._value = val;
    if (!this.buscaPaginada) this.getTotalRegistros();
  }

  get value(): Array<Client | IDocumentoDistribuicao | Monitor> {
    return this._value;
  }

  @Input() paginacaoApi: boolean = false;
  @Input() colunas: IColumn[];
  @Input() acoes: IAcoes[];
  @Input() header: string;
  @Input() subheader: string;
  @Input() textSize: 'small' | 'medium' | 'large' = 'medium';
  @Input() buscaPaginada = true;
  @Input() totalRegistros = 0;
  @Input() rows = 10;
  @Input() tipoRegistro: string;
  @Input() optionsPage = [
    { label: 10, value: 10 },
    { label: 20, value: 20 },
    { label: 50, value: 50 },
    { label: 100, value: 100 }
  ];
  @Input() mensagemEmpty: string;
  @Input() first = 0;

  @Output() pageChange = new EventEmitter<{
    page: number;
    rows: number;
    first?: number;
    sortField?: string;
    sortOrder?: string;
  }>();

  @Output() editar = new EventEmitter<string>();
  @Output() visualizar = new EventEmitter<string>();
  @Output() excluir = new EventEmitter<string>();

  @ViewChild('inputElement') inputElement!: ElementRef;
  @ViewChild('table') table!: Table;

  private _value: Array<Client | IDocumentoDistribuicao | Monitor> = [];

  sortField = '';
  sortOrder = 'asc';

  isMobile = false;

  constructor() {
    this.checkScreenSize();
    window.addEventListener('resize', () => this.checkScreenSize());
  }

  private checkScreenSize() {
    this.isMobile = window.innerWidth <= 768;

    if (this.isMobile && this.dataTable) {
      setTimeout(() => {
        if (this.dataTable) {
          this.dataTable.scrollable = false;
        }
      });
    }
  }

  getHeaderStyles(column: IColumn): string {
    return column.headerStyles ?? '';
  }

  onSort(event: SortEvent) {
    this.sortField = event.field || '';
    this.sortOrder = event.order === 1 ? 'asc' : 'desc';
  }

  customSort(event: SortEvent) {
    if (this.sortField === event.field && this.sortOrder === (event.order === 1 ? 'asc' : 'desc')) {
      return;
    }

    if (this.buscaPaginada && this.paginacaoApi) {
      this.onSort(event);
      this.first = 0;
      this.onBuscarOrder();
    } else {
      TableUtils.customSort(event, this.colunas);
    }
  }

  onRow() {
    this.first = 0;

    const pageChangeData = {
      page: 0,
      rows: this.rows,
      first: 0
    };

    this.pageChange.emit(pageChangeData);
  }

  getInlineStyles(col: IColumn) {
    return col.inlineStyles ?? '';
  }

  getBodyInlineStyles(col: IColumn) {
    return col.bodyInlineStyles ?? '';
  }

  getTotalRegistros() {
    this.totalRegistros = this.value?.length || 0;

    if (this.isMobile) {
      setTimeout(() => {
        const tableContainer = document.querySelector('.table-container');
        if (tableContainer) {
          tableContainer.classList.add('mobile-view');
        }
      });
    }
  }

  get totalRecords() {
    return this.dataTable._totalRecords;
  }

  get totalPageRecords() {
    return this.dataTable._totalRecords === 0 ? 1 : this.totalRegistros;
  }

  get shouldShowPaginator2(): boolean {
    return this.buscaPaginada && this.totalRegistros > this.rows;
  }

  get shouldShowPaginator(): boolean {
      return this.totalRegistros > this.optionsPage[0].value;
  }

  onBuscarOrder() {
    const paginaAtual = this.dataTable.first / this.rows + 1;

    const pageChangeData = {
      page: paginaAtual,
      rows: this.rows,
      sortField: this.sortField,
      sortOrder: this.sortOrder
    };

    this.pageChange.emit(pageChangeData);
  }

  onPageChange(event: PaginatorState) {
    this.first = event.first || 0;
    this.rows = event.rows || this.rows;

    const currentPage = event.page !== undefined ? event.page : Math.floor(this.first / this.rows);

    this.pageChange.emit({
      page: currentPage,
      rows: this.rows,
      first: this.first,
      sortField: this.sortField,
      sortOrder: this.sortOrder
    });
  }

  onRowsChange() {
    this.first = 0;
    this.updatePaginatorState();
  }

  updatePaginatorState() {
    if (this.totalRecords === 0) {
      this.first = 0;
    }
  }

  onEditar(item: Client | Monitor): void {
    this.editar.emit(item.id);
  }

  onVisualizar(item: Client | Monitor): void {
    this.visualizar.emit(item.id);
  }

  onExcluir(item: Client | Monitor): void {
    this.excluir.emit(item.id);
  }

  avisoEmpty() {
    if (this.mensagemEmpty) {
      return this.mensagemEmpty;
    }
    return '';
  }
}
