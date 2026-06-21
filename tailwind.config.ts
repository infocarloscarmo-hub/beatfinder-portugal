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
        // Subtle neon accents
        neon: {
          pink: '#ff2e88',
          purple: '#8b5cf6',
          cyan: '#22d3ee',
          lime: '#a3e635',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        neon: '0 0 0 1px rgba(139,92,246,0.25), 0 0 24px -6px rgba(139,92,246,0.45)',
        'neon-pink': '0 0 0 1px rgba(255,46,136,0.25), 0 0 24px -6px rgba(255,46,136,0.45)',
      },
      backgroundImage: {
        'grid-fade':
          'radial-gradient(circle at 50% 0%, rgba(139,92,246,0.12), transparent 60%)',
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
