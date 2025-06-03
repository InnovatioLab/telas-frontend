import { IAnexo } from "./anexo.interface";
import { DocumentoResponseDTO } from "./response/documentos.dto";

export class Documento {
  id: string;
  titulo: string;
  dataEnvio: string;
  status: string;
  grupoID: string;
  subgrupoID: string;
  responsavelNome: string;
  descricao: string;
  anexo?: IAnexo;
  grupoNome?: string;
  subgrupoNome?: string;

  constructor(data?: Partial<Documento>) {
    this.id = data?.id || '';
    this.titulo = data?.titulo || '';
    this.dataEnvio = data?.dataEnvio || '';
    this.status = data?.status || '';
    this.grupoID = data?.grupoID || '';
    this.subgrupoID = data?.subgrupoID || '';
    this.responsavelNome = data?.responsavelNome || '';
    this.descricao = data?.descricao || '';
    this.anexo = data?.anexo;
    this.grupoNome = data?.grupoNome;
    this.subgrupoNome = data?.subgrupoNome;
  }

  static fromDTO(dto: DocumentoResponseDTO): Documento {
    return new Documento({
      id: dto.id,
      titulo: dto.titulo,
      dataEnvio: dto.dataUpload,
      status: dto.status,
      grupoNome: dto.grupo,
      subgrupoNome: dto.subgrupo
    });
  }

  static fromDTOList(dtos: DocumentoResponseDTO[]): Documento[] {
    return dtos.map(dto => Documento.fromDTO(dto));
  }
}
