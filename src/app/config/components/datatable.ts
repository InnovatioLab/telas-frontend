export const datatable: DatatableTokens = {
  background: 'var(--cor-branca)',
  shadow: 'var(--sombra-padrao)',
  border: {
    radius: 'var(--borda-raio-padrao)',
  },
  header: {
    background: 'var(--cor-primaria)',
    color: 'var(--cor-branca)',
    hover: {
      background: 'var(--cor-primaria)',
    },
  },
  row: {
    background: 'var(--cor-branca)',
    color: 'var(--cor-cinza-escuro)',
    even: {
      background: 'var(--cor-cinza-fundo)',
    },
    hover: {
      background: 'var(--cor-cinza-medio)',
    },
  },
  dark: {
    background: 'var(--cor-card-background-dark)',
    header: {
      background: 'var(--cor-primaria-dark)',
      color: 'var(--cor-branca)',
    },
    row: {
      background: 'var(--cor-card-background-dark)',
      color: 'var(--cor-texto-clara)',
      even: {
        background: 'var(--cor-cinza-fundo-dark)',
      },
      hover: {
        background: 'var(--cor-cinza-medio-dark)',
      },
    },
  },
};

export type DatatableTokens = {
  background?: string;
  shadow?: string;
  border?: {
    radius?: string;
  };
  header?: {
    background?: string;
    color?: string;
    hover?: {
      background?: string;
    };
  };
  row?: {
    background?: string;
    color?: string;
    even?: {
      background?: string;
    };
    hover?: {
      background?: string;
    };
  };
  dark?: {
    background?: string;
    header?: {
      background?: string;
      color?: string;
    };
    row?: {
      background?: string;
      color?: string;
      even?: {
        background?: string;
      };
      hover?: {
        background?: string;
      };
    };
  };
};
