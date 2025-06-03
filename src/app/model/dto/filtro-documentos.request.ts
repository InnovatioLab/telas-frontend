export class FiltroDocumentosRequest {
  grupoID?: string;
  subgrupoID?: string;
  sort?: string;
  sortType?: 'asc' | 'desc';
  page?: number;
  size: number;

 constructor(filtro: IFiltroDocumentosRequest) {
    this.grupoID = filtro.grupoID;
    this.subgrupoID = filtro.subgrupoID;
    this.sort = filtro.sort;
    this.sortType = filtro.sortType;
    this.page = filtro.page ?? 1; // Default to page 1 if not provided
    this.size = filtro.size ?? 10; // Default to 10 items per page if not provided
 }
}

export interface IFiltroDocumentosRequest {
  grupoID?: string;
  subgrupoID?: string;
  sort?: string;
  sortType?: 'asc' | 'desc';
  page?: number;
  size?: number;
}
