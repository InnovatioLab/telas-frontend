export interface ListaPaginada<T> {
  totalRegistros: number;
  paginaAtual: number;
  itensPorPagina: number;
  lista: T[];
}
