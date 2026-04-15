export const dropdown: DropdownTokens = {
  root: {
    border: {
      color: 'var(--cor-cinza-medio)',
    },
    hover: {
      border: {
        color: 'var(--cor-cinza-medio)',
      },
    },
    focus: {
      border: {
        color: 'var(--cor-primaria)',
      },
    },
    disabled: {
      color: 'var(--cor-legenda)',
      background: 'var(--cor-cinza-medio)',
    },
    invalid: {
      border: {
        color: 'var(--cor-erro)',
      },
    },
  },
  trigger: {
    icon: {
      color: 'var(--cor-primaria-escura)',
    },
  },
  panel: {
    background: 'var(--cor-branca)',
  },
  item: {
    color: 'var(--cor-cinza-escuro)',
    hover: {
      background: 'var(--cor-primaria)',
      color: 'var(--cor-branca)',
    },
    selected: {
      background: 'var(--cor-primaria)',
      color: 'var(--cor-branca)',
    },
  },
};

export type DropdownTokens = {
  root?: {
    background?: string;
    disabled?: {
      background?: string;
      color?: string;
    };
    border?: {
      color?: string;
      radius?: string;
    };
    hover?: {
      border?: {
        color?: string;
      };
    };
    focus?: {
      border?: {
        color?: string;
      };
      ring?: {
        width?: string;
        style?: string;
        color?: string;
        offset?: string;
        shadow?: string;
      };
    };
    invalid?: {
      border?: {
        color?: string;
      };
    };
    color?: string;
    placeholder?: {
      color?: string;
    };
  };
  trigger?: {
    icon?: {
      color?: string;
    };
  };
  panel?: {
    background?: string;
    border?: {
      color?: string;
      radius?: string;
    };
    shadow?: string;
  };
  item?: {
    color?: string;
    padding?: string;
    hover?: {
      background?: string;
      color?: string;
    };
    selected?: {
      background?: string;
      color?: string;
    };
  };
};
