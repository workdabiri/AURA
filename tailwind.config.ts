import typography from '@tailwindcss/typography'
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/app/**/*.{ts,tsx}', './src/components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: 'hsl(var(--brand-primary) / <alpha-value>)',
          secondary: 'hsl(var(--brand-secondary) / <alpha-value>)',
          accent: 'hsl(var(--brand-accent) / <alpha-value>)',
        },
        surface: {
          page: 'hsl(var(--surface-page) / <alpha-value>)',
          card: 'hsl(var(--surface-card) / <alpha-value>)',
          overlay: 'hsl(var(--surface-overlay) / <alpha-value>)',
        },
        text: {
          primary: 'hsl(var(--text-primary) / <alpha-value>)',
          secondary: 'hsl(var(--text-secondary) / <alpha-value>)',
          inverse: 'hsl(var(--text-inverse) / <alpha-value>)',
        },
        border: {
          default: 'hsl(var(--border-default) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        serif: ['var(--font-serif)'],
        display: ['var(--font-display)'],
      },
      fontSize: {
        display: ['var(--font-display-size)', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        h1: ['var(--font-h1-size)', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        h2: ['var(--font-h2-size)', { lineHeight: '1.15', letterSpacing: '-0.01em' }],
        h3: ['var(--font-h3-size)', { lineHeight: '1.25', letterSpacing: '-0.01em' }],
        body: ['var(--font-body-size)', { lineHeight: '1.6' }],
        small: ['var(--font-small-size)', { lineHeight: '1.5' }],
        caption: ['var(--font-caption-size)', { lineHeight: '1.4', letterSpacing: '0.04em' }],
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        modal: 'var(--shadow-modal)',
        hero: 'var(--shadow-hero)',
      },
      transitionDuration: {
        fast: 'var(--motion-duration-fast)',
        normal: 'var(--motion-duration-normal)',
        slow: 'var(--motion-duration-slow)',
      },
      transitionTimingFunction: {
        premium: 'var(--motion-easing-premium)',
      },
      maxWidth: {
        container: 'var(--layout-container)',
      },
      spacing: {
        section: 'var(--layout-section-spacing)',
      },
    },
  },
  plugins: [typography],
}

export default config
