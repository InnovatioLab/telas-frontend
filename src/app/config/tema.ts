import { definePreset } from '@primeng/themes';
import Aura from '@primeng/themes/aura';
import { select } from './components/select';
import { inputtext } from './components/inputtext';

// Cores do sistema
const colors = {
  primary: '#232F3E',
  primary_light: '#496382',
  primary_dark: '#131921',
  background_grey: '#f8f9fa',
  grey: '#6c757d',
  medium_grey: '#e9ecef',
  dark_grey: '#212529',
  caption: '#696F74',
  success: '#28a745',
  error: '#dc3545',
  disabled: '#696F74CC',
  white: '#FFFFFF',
  light_black: '#16191B',
};

// Tipografia
const typography = {
  fontFamily: 'Montserrat, sans-serif',
  fontSize: {
    small: '12px',
    default: '14px',
    medium: '16px',
    large: '18px',
    xlarge: '24px',
    title: '26px',
    h5: '30px',
  },
  fontWeight: {
    regular: '400',
    medium: '500',
    bold: '700',
  },
};

// Dimensões
const dimensions = {
  inputHeight: '45px',
  buttonHeight: '47px',
  smallButtonHeight: '36px',
  defaultButtonWidth: '250px',
  smallButtonWidth: '150px',
  dropdownTriggerWidth: '3rem',
};

// Bordas
const borders = {
  defaultRadius: '15px',
  smallRadius: '8px',
  circularRadius: '50%',
  width: '1px',
  style: 'solid',
};

// Espaçamentos
const spacing = {
  small: '8px',
  default: '16px',
  medium: '24px',
  large: '32px',
  xlarge: '48px',
};

// Sombras
const shadows = {
  default: '0 2px 12px rgba(0, 0, 0, 0.1)',
  hover: '0 4px 15px rgba(0, 0, 0, 0.15)',
};

// Transições
const transitions = {
  default: 'all 0.3s ease',
  fast: 'all 0.15s ease',
};

// Cores para a paleta primária do PrimeNG
const primaryPalette = {
  50: colors.background_grey,
  100: colors.medium_grey,
  200: '#d8dfe9',
  300: colors.grey,
  400: colors.primary_light,
  500: colors.primary,
  600: '#1c2632',
  700: colors.primary_dark,
  800: '#0e141a',
  900: '#090e12',
  950: '#050709',
};

// Cores para a paleta de texto do PrimeNG
const textPalette = {
  input: colors.dark_grey,
  button_primary: colors.white,
  caption: colors.caption,
};

// Configuração do tema para o PrimeNG
export const MyPreset = definePreset(Aura, {
  // Definições semânticas de cores
  semantic: {
    colorScheme: {
      primary: primaryPalette,
      text: textPalette,
      light: {
        primary: {
          color: '{primary.500}',
          inverseColor: colors.white,
          hoverColor: '{primary.700}',
          activeColor: '{primary.600}',
        },
        highlight: {
          background: '{primary.700}',
          focusBackground: '{primary.600}',
          color: colors.white,
          focusColor: colors.white,
        },
      },
    },
  },
  // Customizações específicas para componentes
  components: {
    global: {
      css: `
        :root {
          --cor-primaria: ${colors.primary};
          --cor-primaria-clara: ${colors.primary_light};
          --cor-primaria-escura: ${colors.primary_dark};
          --cor-cinza-fundo: ${colors.background_grey};
          --cor-cinza: ${colors.grey};
          --cor-cinza-medio: ${colors.medium_grey};
          --cor-cinza-escuro: ${colors.dark_grey};
          --cor-legenda: ${colors.caption};
          --cor-sucesso: ${colors.success};
          --cor-erro: ${colors.error};
          --cor-desabilitado: ${colors.disabled};
          --cor-branca: ${colors.white};
          --cor-preto-claro: ${colors.light_black};
          
          --fonte-familia: ${typography.fontFamily};
          --fonte-tamanho-pequeno: ${typography.fontSize.small};
          --fonte-tamanho-padrao: ${typography.fontSize.default};
          --fonte-tamanho-medio: ${typography.fontSize.medium};
          --fonte-tamanho-grande: ${typography.fontSize.large};
          --fonte-tamanho-extra-grande: ${typography.fontSize.xlarge};
          --fonte-tamanho-titulo: ${typography.fontSize.title};
          --fonte-tamanho-h5: ${typography.fontSize.h5};
          
          --fonte-peso-regular: ${typography.fontWeight.regular};
          --fonte-peso-medio: ${typography.fontWeight.medium};
          --fonte-peso-negrito: ${typography.fontWeight.bold};
          
          --altura-input: ${dimensions.inputHeight};
          --altura-botao: ${dimensions.buttonHeight};
          --altura-botao-pequeno: ${dimensions.smallButtonHeight};
          --largura-botao-padrao: ${dimensions.defaultButtonWidth};
          --largura-botao-pequeno: ${dimensions.smallButtonWidth};
          --largura-dropdown-trigger: ${dimensions.dropdownTriggerWidth};
          
          --borda-raio-padrao: ${borders.defaultRadius};
          --borda-raio-pequeno: ${borders.smallRadius};
          --borda-raio-circular: ${borders.circularRadius};
          --borda-largura: ${borders.width};
          --borda-estilo: ${borders.style};
          --borda-padrao: var(--borda-largura) var(--borda-estilo) var(--cor-cinza-medio);
          
          --espacamento-pequeno: ${spacing.small};
          --espacamento-padrao: ${spacing.default};
          --espacamento-medio: ${spacing.medium};
          --espacamento-grande: ${spacing.large};
          --espacamento-extra-grande: ${spacing.xlarge};
          
          --sombra-padrao: ${shadows.default};
          --sombra-hover: ${shadows.hover};
          
          --transicao-padrao: ${transitions.default};
          --transicao-rapida: ${transitions.fast};
        }
        
        body {
          font-family: var(--fonte-familia);
          background-color: var(--cor-cinza-fundo);
        }
        
        h5 {
          font-size: var(--fonte-tamanho-h5);
          font-weight: var(--fonte-peso-negrito);
          margin-bottom: 1rem;
        }
      `
    },
    inputtext,
    button: {
      root: {
        height: dimensions.buttonHeight,
        borderRadius: borders.defaultRadius,
        transition: transitions.default,
      },
      primary: {
        background: '{primary.500}',
        color: '{text.button_primary} !important',
        hover: {
          background: '{primary.700}',
          color: '{text.button_primary} !important',
        },
        focus: {
          boxShadow: shadows.default,
        }
      },
    },
    dropdown: {
      root: {
        height: dimensions.inputHeight,
        borderRadius: borders.defaultRadius,
      },
      item: {
        hover: {
          background: '{primary.400}',
          color: colors.white,
        },
        selected: {
          background: '{primary.500}',
          color: colors.white,
        }
      }
    },
    select,
    inputmask: {
      root: {
        height: dimensions.inputHeight,
        borderRadius: borders.defaultRadius,
      }
    },
  }
});
