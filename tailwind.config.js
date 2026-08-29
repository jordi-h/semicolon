/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        ember: {
          DEFAULT: 'hsl(var(--ember))',
          foreground: 'hsl(var(--ember-foreground))',
        },
      },
      fontFamily: {
        // Body/UI face — everything except card hooks and page titles.
        body: ['"Hanken Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['"Hanken Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        // Display face — used with restraint, see fontSize.display-*.
        display: ['"Bricolage Grotesque"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // The app's whole type scale lives here — components reach for
        // these tokens instead of ad-hoc text-2xl/text-xl sizing.
        'display-hook': [
          'clamp(1.75rem, 5vw, 2.25rem)',
          { lineHeight: '1.15', fontWeight: '700', letterSpacing: '-0.01em' },
        ],
        'display-title': ['1.5rem', { lineHeight: '1.2', fontWeight: '700', letterSpacing: '-0.01em' }],
        'body-lg': ['1.0625rem', { lineHeight: '1.55' }],
        'body-md': ['0.9375rem', { lineHeight: '1.4' }],
        'body-sm': ['0.8125rem', { lineHeight: '1.4' }],
        label: ['0.6875rem', { lineHeight: '1.3', letterSpacing: '0.06em', fontWeight: '600' }],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'heart-pop': {
          '0%': { transform: 'scale(1)' },
          '35%': { transform: 'scale(1.32) rotate(-6deg)' },
          '60%': { transform: 'scale(0.94)' },
          '100%': { transform: 'scale(1)' },
        },
        'heart-glow': {
          '0%': { opacity: '0.55', transform: 'scale(0.6)' },
          '100%': { opacity: '0', transform: 'scale(1.5)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'heart-pop': 'heart-pop 0.5s cubic-bezier(.34,1.8,.64,1) forwards',
        'heart-glow': 'heart-glow 0.5s ease-out forwards',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
