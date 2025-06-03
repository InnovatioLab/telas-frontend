import { definePreset } from '@primeng/themes';
import  Aura  from '@primeng/themes/aura';
import { select } from './components/select';
import { inputtext } from './components/inputtext';

const primaryPalette = {
  50: '#f3e9fc',
  100: '#e1ccfa',
  200: '#c89ef4',
  300: '#ab71eb',
  400: '#6a1dbd',
  500: '#430092',
  600: '#39007d',
  700: '#2d0066',
  800: '#260057',
  900: '#1c0044',
  950: '#12002e',
};

const textPalette = {
  input: '#212529',
  button_primary: '#ffffff',
}

export const MyPreset = definePreset(Aura, {
  semantic: {
    colorScheme: {
      primary: primaryPalette,
      text: textPalette,
      light: {
        primary: {
          color: '{primary.500}',
          inverseColor: '#ffffff',
          hoverColor: '{primary.800}',
          activeColor: '{primary.600}',
        },
        highlight: {
          background: '{primary.800}',
          focusBackground: '{primary.600}',
          color: '#ffffff',
          focusColor: '#ffffff',
        },
      },
    },
  },
  components: {
    inputtext,
    button: {
      primary: {
        color: '{text.button_primary} !important',
        hover: {
          color: '{text.button_primary} !important',
        }
      },
    },
    select,


  }
});
