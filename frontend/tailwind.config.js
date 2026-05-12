/** @type {import('tailwindcss').Config} */
module.exports = {
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
      borderRadius: {
        xl: '20px',
        lg: '14px',
        md: '10px',
        sm: '8px'
      },
      boxShadow: {
        card: '0 1px 2px rgba(16, 18, 22, 0.04), 0 10px 30px -12px rgba(16, 18, 22, 0.12)',
        soft: '0 1px 2px rgba(16, 18, 22, 0.04)',
        focus: '0 0 0 3px hsl(var(--color-brand) / 0.18)'
      },
      backdropBlur: {
        panel: '12px'
      },
      animation: {
        fadeIn: 'fadeIn 0.35s ease-out both',
        riseIn: 'riseIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        riseIn: {
          '0%': { opacity: '0', transform: 'translate3d(0, 6px, 0)' },
          '100%': { opacity: '1', transform: 'translate3d(0, 0, 0)' }
        }
      }
    }
  },
  plugins: []
};
