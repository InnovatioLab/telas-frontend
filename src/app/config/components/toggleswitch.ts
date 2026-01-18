export const toggleswitch: ToggleSwitchTokens = {
  slider: {
    color: 'var(--cor-branca)',
    checked: {
      background: 'var(--cor-cinza-fundo)',
    },
  },
};

export type ToggleSwitchTokens = {
  slider?: {
    color?: string;
    checked?: {
      background?: string;
    };
  };
};
