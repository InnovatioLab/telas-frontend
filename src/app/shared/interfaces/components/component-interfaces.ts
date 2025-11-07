import { EventEmitter } from '@angular/core';
import { MapPoint } from '@app/core/service/state/map-point.interface';

/**
 * Interface para componentes de mapa
 * Define contrato para componentes que trabalham com mapas
 */
export interface IMapComponent {
  /**
   * Pontos a serem exibidos no mapa
   */
  points: MapPoint[];

  /**
   * Centro do mapa
   */
  center: { lat: number; lng: number } | null;

  /**
   * Zoom do mapa
   */
  zoom: number;

  /**
   * Evento disparado quando um ponto é clicado
   */
  pointClick: EventEmitter<{ point: MapPoint; event: MouseEvent }>;

  /**
   * Evento disparado quando o mapa é inicializado
   */
  mapInitialized: EventEmitter<google.maps.Map>;

  /**
   * Inicializa o mapa
   */
  initializeMap(): void;

  /**
   * Adiciona pontos ao mapa
   * @param points - Pontos para adicionar
   */
  addPoints(points: MapPoint[]): void;

  /**
   * Remove pontos do mapa
   * @param pointIds - IDs dos pontos para remover
   */
  removePoints(pointIds: string[]): void;

  /**
   * Limpa todos os pontos do mapa
   */
  clearPoints(): void;
}

/**
 * Interface para componentes de formulário
 */
export interface IFormComponent<T> {
  /**
   * Dados do formulário
   */
  formData: T;

  /**
   * Indica se o formulário é válido
   */
  isValid: boolean;

  /**
   * Indica se o formulário foi submetido
   */
  isSubmitted: boolean;

  /**
   * Evento disparado quando o formulário é submetido
   */
  formSubmit: EventEmitter<T>;

  /**
   * Evento disparado quando o formulário é cancelado
   */
  formCancel: EventEmitter<void>;

  /**
   * Valida o formulário
   * @returns boolean indicando se é válido
   */
  validateForm(): boolean;

  /**
   * Reseta o formulário
   */
  resetForm(): void;

  /**
   * Submete o formulário
   */
  submitForm(): void;
}

/**
 * Interface para componentes de lista
 */
export interface IListComponent<T> {
  /**
   * Itens da lista
   */
  items: T[];

  /**
   * Indica se está carregando
   */
  isLoading: boolean;

  /**
   * Indica se há erro
   */
  hasError: boolean;

  /**
   * Mensagem de erro
   */
  errorMessage: string | null;

  /**
   * Evento disparado quando um item é selecionado
   */
  itemSelect: EventEmitter<T>;

  /**
   * Evento disparado quando um item é editado
   */
  itemEdit: EventEmitter<T>;

  /**
   * Evento disparado quando um item é removido
   */
  itemDelete: EventEmitter<T>;

  /**
   * Carrega os itens da lista
   */
  loadItems(): void;

  /**
   * Atualiza a lista
   */
  refreshList(): void;

  /**
   * Filtra os itens
   * @param filter - Critério de filtro
   */
  filterItems(filter: any): void;
}

/**
 * Interface para componentes de modal
 */
export interface IModalComponent<T> {
  /**
   * Indica se o modal está aberto
   */
  isOpen: boolean;

  /**
   * Dados do modal
   */
  data: T | null;

  /**
   * Evento disparado quando o modal é fechado
   */
  modalClose: EventEmitter<void>;

  /**
   * Evento disparado quando o modal é confirmado
   */
  modalConfirm: EventEmitter<T>;

  /**
   * Abre o modal
   * @param data - Dados para o modal
   */
  open(data?: T): void;

  /**
   * Fecha o modal
   */
  close(): void;

  /**
   * Confirma o modal
   */
  confirm(): void;
}

/**
 * Interface para componentes de tabela
 */
export interface ITableComponent<T> {
  /**
   * Dados da tabela
   */
  data: T[];

  /**
   * Colunas da tabela
   */
  columns: ITableColumn[];

  /**
   * Indica se está carregando
   */
  isLoading: boolean;

  /**
   * Paginação atual
   */
  pagination: IPagination;

  /**
   * Evento disparado quando a página muda
   */
  pageChange: EventEmitter<IPagination>;

  /**
   * Evento disparado quando uma linha é selecionada
   */
  rowSelect: EventEmitter<T>;

  /**
   * Evento disparado quando uma linha é editada
   */
  rowEdit: EventEmitter<T>;

  /**
   * Evento disparado quando uma linha é removida
   */
  rowDelete: EventEmitter<T>;

  /**
   * Carrega os dados da tabela
   */
  loadData(): void;

  /**
   * Atualiza a tabela
   */
  refreshTable(): void;
}

/**
 * Interfaces auxiliares
 */
export interface ITableColumn {
  field: string;
  header: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  type?: 'text' | 'number' | 'date' | 'boolean';
}

export interface IPagination {
  page: number;
  size: number;
  total: number;
  totalPages: number;
}







