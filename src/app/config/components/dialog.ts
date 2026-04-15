export const dialog: DialogTokens = {
  background: 'var(--cor-branca)',
  shadow: 'var(--sombra-padrao)',
  border: {
    radius: 'var(--modal-border-radius)',
  },
  header: {
    background: 'var(--modal-header-bg)',
    color: 'var(--cor-primaria)',
    border: {
      color: 'var(--cor-cinza-medio)',
    },
    title: {
      color: 'var(--cor-primaria)',
    },
    close: {
      color: 'var(--cor-primaria)',
    },
  },
  content: {
    background: 'var(--modal-content-bg)',
    color: 'var(--cor-cinza-escuro)',
    padding: 'var(--modal-padding)',
  },
  footer: {
    background: 'var(--modal-footer-bg)',
    padding: 'var(--modal-padding)',
    border: {
      color: 'var(--cor-cinza-medio)',
    },
  },
};

export type DialogTokens = {
  background?: string;
  shadow?: string;
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
    };
    close?: {
      color?: string;
    };
  };
  content?: {
    background?: string;
    color?: string;
    padding?: string;
  };
  footer?: {
    background?: string;
    padding?: string;
    border?: {
      color?: string;
    };
  };
};
