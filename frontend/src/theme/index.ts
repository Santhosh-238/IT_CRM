import { createTheme, MantineColorsTuple } from '@mantine/core';
import CRM_COLORS from './colors';

// Dynamic Primary Obsidian Swatch
const obsidian: MantineColorsTuple = [
  '#f8fafc',
  '#f1f5f9',
  '#e2e8f0',
  '#cbd5e1',
  '#94a3b8',
  '#64748b',
  '#475569',
  '#334155',
  CRM_COLORS.primary,
  CRM_COLORS.primaryDark,
];

// Dynamic Airy Slate Swatch
const slate: MantineColorsTuple = [
  CRM_COLORS.backgroundLight,
  CRM_COLORS.background,
  '#e2ecf2',
  '#d0e0eb',
  '#bad0df',
  '#98b8ce',
  '#749ebd',
  '#4f80a4',
  '#3a6686',
  '#2a4b65',
];

export const theme = createTheme({
  fontFamily: 'Plus Jakarta Sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontFamilyMonospace: 'JetBrains Mono, monospace',
  headings: {
    fontFamily: 'Plus Jakarta Sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontWeight: '700',
  },
  primaryColor: 'obsidian',
  primaryShade: 8,
  colors: {
    obsidian,
    slate,
  },
  defaultRadius: 'xl',
  cursorType: 'pointer',
  components: {
    Button: {
      defaultProps: {
        radius: 'xl',
      },
      styles: {
        root: {
          fontWeight: 600,
          letterSpacing: '0.01em',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        },
      },
    },
    Card: {
      defaultProps: {
        radius: 'xl',
        padding: 'lg',
      },
      styles: {
        root: {
          border: `1px solid ${CRM_COLORS.border}`,
          backgroundColor: CRM_COLORS.cardBg,
          backdropFilter: 'blur(16px)',
          boxShadow: '0 10px 30px -5px rgba(0, 49, 31, 0.04), 0 4px 12px -2px rgba(0, 49, 31, 0.02)',
          transition: 'all 0.25s ease',
        },
      },
    },
    Paper: {
      defaultProps: {
        radius: 'xl',
      },
    },
    Badge: {
      defaultProps: {
        radius: 'xl',
        variant: 'light',
      },
      styles: {
        root: {
          fontWeight: 600,
          textTransform: 'none',
          padding: '4px 10px',
        },
      },
    },
    TextInput: {
      defaultProps: {
        radius: 'xl',
      },
    },
    Select: {
      defaultProps: {
        radius: 'xl',
      },
    },
    Modal: {
      defaultProps: {
        radius: '24px',
        overlayProps: {
          blur: 6,
          backgroundOpacity: 0.45,
        },
      },
    },
  },
});

export { CRM_COLORS };
