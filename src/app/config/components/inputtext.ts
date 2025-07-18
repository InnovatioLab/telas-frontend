export const inputtext: InputTextTokens = {
  color: 'var(--cor-cinza-escuro)',
  background: 'transparent',
  border: {
    color: 'var(--cor-cinza-medio)',
  },
  disabled: {
    background: 'var(--cor-cinza-medio)',
    color: 'var(--cor-legenda)',
  },
  hover: {
    border: {
      color: 'var(--cor-cinza-medio)',
    },
  },
  placeholder: {
    color: 'var(--cor-legenda)',
  },
  invalid: {
    border: {
      color: 'var(--cor-erro)',
    },
    placeholder: {
      color: 'var(--cor-erro)',
    },
  }
}

export type InputTextTokens = {
  background?: string;
  disabled?: {
    background?: string;
    color?: string;
  };
  filled?: {
    background?: string;
    hover?: {
      background?: string;
    };
    focus?: {
      background?: string;
    };
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
    placeholder?: {
      color?: string;
    };
  };
  color?: string;
  placeholder?: {
    color?: string;
  };
  shadow?: string;
  padding?: {
    x?: string;
    y?: string;
  };
  transition?: {
    duration?: string;
  };
  sm?: {
    font?: {
      size?: string;
    };
    padding?: {
      x?: string;
      y?: string;
    };
  };
  lg?: {
    font?: {
      size?: string;
    };
    padding?: {
      x?: string;
      y?: string;
    };
  };
};
