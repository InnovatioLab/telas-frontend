export const password: PasswordTokens = {

}

export type PasswordTokens = {
  meter?: {
    background?: string;
    border?: {
      radius?: string;
    };
    height?: string;
  };
  icon?: {
    color?: string;
  };
  overlay?: {
    background?: string;
    border?: {
      color?: string;
      radius?: string;
    };
    color?: string;
    padding?: string;
    shadow?: string;
  };
  content?: {
    gap?: string;
  };
  strength?: {
    weak?: {
      background?: string;
    };
    medium?: {
      background?: string;
    };
    strong?: {
      background?: string;
    };
  };
};
