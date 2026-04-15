import { ToggleButton } from 'primeng/togglebutton';

export const DEFAULT_TOGGLEBUTTON_STYLES: Partial<ToggleButton> = {
  style: {
    marginTop: '20px',
    border: 'none',
  },
};

export const DEFAULT_TOGGLEBUTTON_DARK_STYLES: Partial<ToggleButton> = {
  ...DEFAULT_TOGGLEBUTTON_STYLES,
};
