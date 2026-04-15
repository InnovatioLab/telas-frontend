export const card: CardTokens = {
  background: 'transparent',
  color: 'var(--cor-primaria)',
  border: {
    radius: 'var(--borda-raio-padrao)',
  },
  shadow: 'var(--sombra-padrao)',
};

export type CardTokens = {
  background?: string;
  color?: string;
  border?: {
    radius?: string;
  };
  shadow?: string;
};
