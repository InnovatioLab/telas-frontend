export interface Subgrupo {
  id: string;
  nome: string;
  grupoId?: string;
}

export class SubgrupoModel implements Subgrupo {
  id: string;
  nome: string;
  grupoId?: string;

  constructor(data?: Partial<SubgrupoModel>) {
    this.id = data?.id || '';
    this.nome = data?.nome || '';
    this.grupoId = data?.grupoId;
  }

  static fromDTO(dto: any): SubgrupoModel {
    return new SubgrupoModel({
      id: dto.id,
      nome: dto.nome,
      grupoId: dto.grupoId
    });
  }
}
