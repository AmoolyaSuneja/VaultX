/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: {
    relative: true,
    files: ['./index.html', './src/**/*.{ts,tsx}']
  },
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--color-background) / <alpha-value>)',
        panel: 'hsl(var(--color-panel) / <alpha-value>)',
        surface: 'hsl(var(--color-surface) / <alpha-value>)',
        'surface-soft': 'hsl(var(--color-surface-soft) / <alpha-value>)',
        'surface-muted': 'hsl(var(--color-surface-muted) / <alpha-value>)',
        'surface-raised': 'hsl(var(--color-surface-raised) / <alpha-value>)',
        'surface-sunken': 'hsl(var(--color-surface-sunken) / <alpha-value>)',
        brand: {
          DEFAULT: 'hsl(var(--color-brand) / <alpha-value>)',
          deep: 'hsl(var(--color-brand-deep) / <alpha-value>)',
          light: 'hsl(var(--color-brand-light) / <alpha-value>)',
          muted: 'hsl(var(--color-brand-muted) / <alpha-value>)'
        },
        accent: {
          DEFAULT: 'hsl(var(--color-accent) / <alpha-value>)',
          light: 'hsl(var(--color-accent-light) / <alpha-value>)',
          muted: 'hsl(var(--color-accent-muted) / <alpha-value>)'
        },
        steel: {
          DEFAULT: 'hsl(var(--color-steel) / <alpha-value>)',
          light: 'hsl(var(--color-steel-light) / <alpha-value>)',
          muted: 'hsl(var(--color-steel-muted) / <alpha-value>)'
        },
        danger: {
          DEFAULT: 'hsl(var(--color-danger) / <alpha-value>)',
          light: 'hsl(var(--color-danger-light) / <alpha-value>)'
        },
        line: 'hsl(var(--color-line) / <alpha-value>)',
        textPrimary: 'hsl(var(--color-text-primary) / <alpha-value>)',
        textMuted: 'hsl(var(--color-text-muted) / <alpha-value>)'
      },
      fontFamily: {
        sans: ['"Instrument Sans"', 'system-ui', 'sans-serif'],
        heading: ['"Fraunces"', 'Georgia', 'serif']
      },
      fontSize: {
        'xs-plus': ['0.8125rem', { lineHeight: '1.35' }]
      },
      letterSpacing: {
        label: '0.14em'
      },
      borderRadius: {
        xl: '14px',
        lg: '12px',
        md: '8px',
        sm: '6px'
      },
      boxShadow: {
        card: '0 1px 2px rgba(16, 18, 22, 0.04), 0 8px 24px -12px rgba(16, 18, 22, 0.10)',
        soft: '0 1px 2px rgba(16, 18, 22, 0.04)',
        focus: '0 0 0 3px hsl(var(--color-text-primary) / 0.14)'
      },
      backdropBlur: {
        panel: '10px'
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.22, 1, 0.36, 1)'
      },
      transitionDuration: {
        180: '180ms',
        280: '280ms'
      },
      animation: {
        fadeIn: 'fadeIn 280ms cubic-bezier(0.22, 1, 0.36, 1) both',
        riseIn: 'riseIn 320ms cubic-bezier(0.22, 1, 0.36, 1) both'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        riseIn: {
          '0%': { opacity: '0', transform: 'translate3d(0, 4px, 0)' },
          '100%': { opacity: '1', transform: 'translate3d(0, 0, 0)' }
        }
      }
    }
  },
  plugins: []
};
