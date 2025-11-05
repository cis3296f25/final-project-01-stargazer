// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',

        surfaceAlt: 'rgb(var(--color-surface-alt) / <alpha-value>)',

        accent: 'rgb(var(--color-accent) / <alpha-value>)',
        textSecondary: 'rgb(var(--color-text-secondary) / <alpha-value>)',

        accentMuted: 'var(--color-accent-muted)',
        textPrimary: 'var(--color-text-primary)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        danger: 'var(--color-danger)',
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"Roboto Mono"', 'monospace'],
      },
      boxShadow: {
        glow: '0 10px 40px rgba(33, 150, 243, 0.35)',
      },
    },
  },
  plugins: [],
};

export default config;
