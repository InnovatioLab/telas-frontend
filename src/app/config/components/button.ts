export const button: ButtonTokens = {
  primary: {
    background: '#1976d2',
    border: {
      color: '#1976d2',
    },
    color: '#ffffff',
    hover: {
      background: '#1976d2',
      border: {
        color: '#1976d2',
      },
      color: '#ffffff',
    },
    dark: {
      background: '#1565c0',
      border: {
        color: '#1565c0',
      },
      color: '#ffffff',
    }
  },
  text: {
    background: 'transparent',
    border: {
      color: 'transparent',
    },
    color: '#1976d2',
    dark: {
      color: '#8fb7ff',
    }
  }
};

export type ButtonTokens = {
  primary?: {
    background?: string;
    border?: {
      color?: string;
    };
    color?: string;
    hover?: {
      background?: string;
      border?: {
        color?: string;
      };
      color?: string;
    };
    focus?: {
      background?: string;
      border?: {
        color?: string;
      };
      color?: string;
    };
    active?: {
      background?: string;
      border?: {
        color?: string;
      };
      color?: string;
    };
    dark?: {
      background?: string;
      border?: {
        color?: string;
      };
      color?: string;
    }
  };
  text?: {
    background?: string;
    border?: {
      color?: string;
    };
    color?: string;
    dark?: {
      color?: string;
    }
  };
};
