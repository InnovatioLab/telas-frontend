export interface Grupo {
  id: string;
  nome: string;
}

export class GrupoModel implements Grupo {
  id: string;
  nome: string;

  constructor(data?: Partial<GrupoModel>) {
    this.id = data?.id || '';
    this.nome = data?.nome || '';
  }

  static fromDTO(dto: any): GrupoModel {
    return new GrupoModel({
      id: dto.id,
      nome: dto.nome
    });
  }
}
