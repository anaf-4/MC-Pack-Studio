import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        minecraft: ['"Press Start 2P"', 'monospace'],
      },
      colors: {
        mc: {
          dirt: '#866043',
          grass: '#5D8A35',
          stone: '#8B8B8B',
          wood: '#B3862A',
          diamond: '#2ECECA',
          gold: '#FCEE4B',
          iron: '#D8D8D8',
          emerald: '#17DD62',
          'bg-dark': '#1A1A1A',
          'bg-panel': '#2D2D2D',
          'bg-hover': '#3A3A3A',
          'border': '#555555',
          'text-primary': '#FFFFFF',
          'text-secondary': '#AAAAAA',
          'text-muted': '#666666',
          'accent': '#55FF55',
          'accent-hover': '#7FFF7F',
          'danger': '#FF5555',
          'warning': '#FFAA00',
        },
      },
    },
  },
  plugins: [],
} satisfies Config
