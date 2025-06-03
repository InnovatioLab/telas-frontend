import { GRUPOS, SUBGRUPOS } from '@app/shared/constants/grupos-subgupos.constants';

export class GrupoSubgrupoNormalizer {
  static normalizarGrupo(grupoValue: string | undefined): string {
    if (!grupoValue) return '';

    const grupoExato = GRUPOS.find(g => g.value === grupoValue.toLowerCase());
    if (grupoExato) return grupoExato.value;

    const grupoPorLabel = GRUPOS.find(g =>
      g.label.toLowerCase() === grupoValue.toLowerCase()
    );
    if (grupoPorLabel) return grupoPorLabel.value;

    return grupoValue.toLowerCase();
  }

  static normalizarSubgrupo(subgrupoValue: string | undefined): string {
    if (!subgrupoValue) return '';

    const subgrupoExato = SUBGRUPOS.find(s => s.value === subgrupoValue.toLowerCase());
    if (subgrupoExato) return subgrupoExato.value;

    const subgrupoPorLabel = SUBGRUPOS.find(s =>
      s.label.toLowerCase() === subgrupoValue.toLowerCase()
    );
    if (subgrupoPorLabel) return subgrupoPorLabel.value;

    return subgrupoValue.toLowerCase();
  }

  static encontrarGrupoPorSubgrupo(subgrupoValue: string | undefined): string | undefined {
    if (!subgrupoValue) return undefined;

    const subgrupoNormalizado = this.normalizarSubgrupo(subgrupoValue);
    const subgrupo = SUBGRUPOS.find(s => s.value === subgrupoNormalizado);

    return subgrupo?.grupo;
  }

  static obterLabelGrupo(value: string | undefined): string {
    if (!value) return '';

    const grupo = GRUPOS.find(g => g.value === this.normalizarGrupo(value));
    if (grupo) return grupo.label;

    return this.formatarParaExibicao(value);
  }

  static obterLabelSubgrupo(value: string | undefined): string {
    if (!value) return '';

    const subgrupo = SUBGRUPOS.find(s => s.value === this.normalizarSubgrupo(value));
    if (subgrupo) return subgrupo.label;

    return this.formatarParaExibicao(value);
  }

  private static formatarParaExibicao(value: string): string {
    if (!value) return '';

    let texto = value.replace(/_/g, ' ');

    texto = texto
      .split(' ')
      .map(palavra => palavra.charAt(0).toUpperCase() + palavra.slice(1))
      .join(' ');

    return texto;
  }
}
