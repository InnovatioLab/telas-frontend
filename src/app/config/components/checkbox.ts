export const checkbox: CheckboxTokens = {
  box: {
    border: {
      color: 'var(--cor-primaria)',
    },
    background: 'var(--cor-branca)',
    hover: {
      border: {
        color: 'var(--cor-primaria-escura)',
      },
    },
    checked: {
      background: 'var(--cor-primaria)',
      border: {
        color: 'var(--cor-primaria)',
      },
    },
    focus: {
      border: {
        color: 'var(--cor-primaria)',
      },
      shadow: '0 0 0 2px rgba(var(--cor-primaria-rgb), 0.2)',
    },
    disabled: {
      background: 'var(--cor-cinza-medio)',
      border: {
        color: 'var(--cor-cinza)',
      },
    },
  },
  icon: {
    color: 'var(--cor-branca)',
  },
};

export type CheckboxTokens = {
  box?: {
    border?: {
      color?: string;
    };
    background?: string;
    hover?: {
      border?: {
        color?: string;
      };
    };
    checked?: {
      background?: string;
      border?: {
        color?: string;
      };
    };
    focus?: {
      border?: {
        color?: string;
      };
      shadow?: string;
    };
    disabled?: {
      background?: string;
      border?: {
        color?: string;
      };
    };
  };
  icon?: {
    color?: string;
  };
};
