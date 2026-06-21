import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Dark base
        ink: {
          950: '#06060a',
          900: '#0a0a12',
          800: '#10101c',
          700: '#181828',
          600: '#222238',
        },
        // Paleta da marca (pôr do sol do logótipo: turquesa → laranja).
        // Mantemos as chaves "neon.*" para não mexer em todos os componentes.
        neon: {
          purple: '#2dd4bf', // turquesa (cor primária)
          cyan: '#22d3ee',   // ciano
          pink: '#ff7a3c',   // laranja do pôr do sol
          lime: '#fbbf24',   // âmbar/dourado (destaques quentes)
        },
        brand: {
          teal: '#2dd4bf',
          cyan: '#22d3ee',
          orange: '#ff7a3c',
          coral: '#ff5e5e',
          amber: '#fbbf24',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        neon: '0 0 0 1px rgba(45,212,191,0.25), 0 0 24px -6px rgba(45,212,191,0.50)',
        'neon-pink': '0 0 0 1px rgba(255,122,60,0.25), 0 0 24px -6px rgba(255,122,60,0.50)',
      },
      backgroundImage: {
        'grid-fade':
          'radial-gradient(circle at 50% 0%, rgba(34,211,238,0.10), transparent 55%), radial-gradient(circle at 80% 10%, rgba(255,122,60,0.10), transparent 55%)',
        'brand-gradient': 'linear-gradient(90deg, #2dd4bf 0%, #22d3ee 35%, #fbbf24 70%, #ff7a3c 100%)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.4s ease-out both',
        'pulse-glow': 'pulse-glow 2.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
