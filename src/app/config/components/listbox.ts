export const listbox: ListboxTokens = {
  list: {
    background: 'var(--cor-branca)',
    color: 'var(--cor-cinza-escuro)',
    border: {
      color: 'var(--cor-cinza-medio)',
      radius: '8px',
    },
    shadow: 'none',
  },
  option: {
    background: 'transparent',
    color: 'var(--cor-cinza-escuro)',
    focus: {
      background: 'var(--cor-cinza-medio)',
      color: 'var(--cor-primaria)',
    },
    selected: {
      background: 'var(--cor-cinza-medio)',
      color: 'var(--cor-primaria)',
    },
    hover: {
      background: 'var(--cor-cinza-fundo)',
      color: 'var(--cor-primaria)',
    },
  },
};

export type ListboxTokens = {
  list?: {
    background?: string;
    color?: string;
    border?: {
      color?: string;
      radius?: string;
    };
    shadow?: string;
  };
  option?: {
    background?: string;
    color?: string;
    focus?: {
      background?: string;
      color?: string;
    };
    selected?: {
      background?: string;
      color?: string;
    };
    hover?: {
      background?: string;
      color?: string;
    };
  };
};
