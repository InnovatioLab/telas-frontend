export interface AtualizarDocumentoRequestDTO {
  titulo: string;
  grupo: string;
  subgrupo: string;
  descricao: string;
  responsavel: string;
}

export class AtualizarDocumentoRequest implements AtualizarDocumentoRequestDTO {
  titulo: string;
  grupo: string;
  subgrupo: string;
  descricao: string;
  responsavel: string;

  constructor(data?: Partial<AtualizarDocumentoRequest>) {
    this.titulo = data?.titulo || '';
    this.grupo = data?.grupo || '';
    this.subgrupo = data?.subgrupo || '';
    this.descricao = data?.descricao || '';
    this.responsavel = data?.responsavel || '';
  }

  static fromFormData(formData: FormData): AtualizarDocumentoRequest {
    return new AtualizarDocumentoRequest({
      titulo: typeof formData.get('titulo_documento') === 'string' ? (formData.get('titulo_documento') as string) : '',
      grupo: typeof formData.get('grupo') === 'string' ? (formData.get('grupo') as string) : '',
      subgrupo: typeof formData.get('subgrupo') === 'string' ? (formData.get('subgrupo') as string) : '',
      descricao: typeof formData.get('descricao') === 'string' ? (formData.get('descricao') as string) : '',
      responsavel: typeof formData.get('responsavel') === 'string' ? (formData.get('responsavel') as string) : ''
    });
  }
}
