export const datepicker: DatepickerTokens = {
  background: 'var(--cor-branca)',
  border: {
    radius: 'var(--borda-raio-padrao)',
  },
  header: {
    background: 'var(--cor-branca)',
    color: 'var(--cor-cinza-escuro)',
    border: {
      color: 'var(--borda-padrao)',
    },
    title: {
      color: 'var(--cor-cinza-escuro)',
      hover: {
        background: 'var(--cor-primaria-escura)',
        color: 'var(--cor-branca)',
      },
    },
    navigation: {
      color: 'var(--cor-primaria)',
      hover: {
        color: 'var(--cor-primaria-escura)',
      },
    },
  },
  calendar: {
    dayHeader: {
      color: 'var(--cor-cinza-escuro)',
    },
    day: {
      color: 'var(--cor-cinza-escuro)',
      hover: {
        background: 'var(--cor-primaria)',
        color: 'var(--cor-branca)',
      },
      selected: {
        background: 'var(--cor-primaria-escura)',
        color: 'var(--cor-branca)',
      },
      today: {
        background: 'var(--cor-primaria-escura)',
        color: 'var(--cor-branca)',
      },
    },
  },
};

export type DatepickerTokens = {
  background?: string;
  border?: {
    radius?: string;
  };
  header?: {
    background?: string;
    color?: string;
    border?: {
      color?: string;
    };
    title?: {
      color?: string;
      hover?: {
        background?: string;
        color?: string;
      };
    };
    navigation?: {
      color?: string;
      hover?: {
        color?: string;
      };
    };
  };
  calendar?: {
    dayHeader?: {
      color?: string;
    };
    day?: {
      color?: string;
      hover?: {
        background?: string;
        color?: string;
      };
      selected?: {
        background?: string;
        color?: string;
      };
      today?: {
        background?: string;
        color?: string;
      };
    };
  };
};
