import { Documento } from '@app/model/documento';

export interface DocumentoResponseDTO {
  id: string;
  titulo: string;
  grupo: string;
  subgrupo: string;
  status: string;
  dataUpload: string;
  responsavel?: string;
  descricao?: string;
  nomeArquivo?: string;
}

export interface DocumentosListResponse {
  items: DocumentoResponseDTO[];
  total: number;
  pagina: number;
  itensPorPagina: number;
}

export interface DocumentoDetalhesDTO {
  id: string;
  titulo: string;
  grupo: string;
  subgrupo: string;
  descricao: string;
  dataUpload: string;
  responsavel: string;
  status: string;
  nomeArquivo: string;
}

export class DocumentoDTOUtils {
  static fromDTOList(dtoList: DocumentoResponseDTO[]): Documento[] {
    return dtoList.map(dto => Documento.fromDTO(dto));
  }

  static fromDetalhesDTO(dto: DocumentoDetalhesDTO): Documento {
    return Documento.fromDTO(dto);
  }
}
