

export const select: SelectTokens = {
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
    placeholder: {
      color: 'var(--cor-erro)',
    },
  }
}

export type SelectTokens = {
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
  dropdown?: {
    width?: string;
    color?: string;
  };
  overlay?: {
    background?: string;
    border?: {
      color?: string;
      radius?: string;
    };
    color?: string;
    shadow?: string;
  };
  list?: {
    padding?: string;
    gap?: string;
    header?: {
      padding?: string;
    };
  };
  option?: {
    focus?: {
      background?: string;
      color?: string;
    };
    selected?: {
      background?: string;
      focus?: {
        background?: string;
        color?: string;
      };
      color?: string;
    };
    color?: string;
    padding?: string;
    border?: {
      radius?: string;
    };
    group?: {
      background?: string;
      color?: string;
      font?: {
        weight?: string;
      };
      padding?: string;
    };
  };
  clear?: {
    icon?: {
      color?: string;
    };
  };
  checkmark?: {
    color?: string;
    gutter?: {
      start?: string;
      end?: string;
    };
  };
  empty?: {
    message?: {
      padding?: string;
    };
  };
};
