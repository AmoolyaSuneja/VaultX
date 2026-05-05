/** @type {import('tailwindcss').Config} */
module.exports = {
  content: {
    relative: true,
    files: [
      './index.html',
      './src/**/*.{ts,tsx}'
    ]
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
        xl: '28px',
        lg: '20px',
        md: '16px',
        sm: '10px'
      },
      boxShadow: {
        card: '0 18px 48px rgba(31, 95, 166, 0.12)',
        soft: '0 10px 28px rgba(96, 125, 139, 0.12)',
        focus: '0 0 0 4px rgba(91, 155, 213, 0.18)'
      },
      backdropBlur: {
        panel: '16px'
      },
      animation: {
        shimmer: 'shimmer 1.4s ease-in-out',
        float: 'float 8s ease-in-out infinite',
        pulseSoft: 'pulseSoft 2.4s ease-in-out infinite'
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        },
        float: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0)' },
          '50%': { transform: 'translate3d(0, -14px, 0)' }
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.65' },
          '50%': { opacity: '1' }
        }
      }
    }
  },
  plugins: []
};
