export const paginator: PaginatorTokens = {
  background: 'var(--cor-branca)',
  color: 'var(--cor-cinza-escuro)',
  current: {
    color: 'var(--cor-legenda)',
  },
  button: {
    color: 'var(--cor-primaria)',
    background: 'transparent',
    hover: {
      background: 'var(--cor-cinza-medio)',
    },
    selected: {
      background: 'var(--cor-primaria)',
      color: 'var(--cor-branca)',
    },
    disabled: {
      color: 'var(--cor-legenda)',
    },
  },
  dark: {
    background: 'var(--cor-card-background-dark)',
    color: 'var(--cor-texto-clara)',
    current: {
      color: 'var(--cor-texto-clara)',
    },
  },
};

export type PaginatorTokens = {
  background?: string;
  color?: string;
  current?: {
    color?: string;
  };
  button?: {
    color?: string;
    background?: string;
    hover?: {
      background?: string;
    };
    selected?: {
      background?: string;
      color?: string;
    };
    disabled?: {
      color?: string;
    };
  };
  dark?: {
    background?: string;
    color?: string;
    current?: {
      color?: string;
    };
  };
};
