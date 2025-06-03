import { environment } from 'src/environments/environment';

export class Documento {
  id: string;
  titulo: string;
  grupo: string;
  subgrupo: string;
  status: string;
  dataEnvio: string;
  responsavel: string;
  descricao: string;
  arquivoUrl?: string;
  arquivoNome?: string;

  constructor(data?: Partial<Documento>) {
    this.id = data?.id || '';
    this.titulo = data?.titulo || '';
    this.grupo = data?.grupo || '';
    this.subgrupo = data?.subgrupo || '';
    this.status = data?.status || '';
    this.dataEnvio = data?.dataEnvio || '';
    this.responsavel = data?.responsavel || '';
    this.descricao = data?.descricao || '';
    this.arquivoUrl = data?.arquivoUrl || '';
    this.arquivoNome = data?.arquivoNome || '';
  }

  static fromDTO(dto: any): Documento {
    return new Documento({
      id: dto.id,
      titulo: dto.titulo,
      grupo: dto.grupo,
      subgrupo: dto.subgrupo,
      status: dto.status || 'Disponível',
      dataEnvio: dto.dataUpload || dto.dataEnvio,
      responsavel: dto.responsavel,
      descricao: dto.descricao,
      arquivoNome: dto.nomeArquivo || dto.arquivoNome,
      arquivoUrl: dto.arquivoUrl || `${environment.urlApi}files/download/${dto.id}`
    });
  }
}
