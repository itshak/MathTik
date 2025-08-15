import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#6c5ce7',
          600: '#5b4dd5',
        },
        accent: '#f59e0b',
        good: '#22c55e',
        bad: '#ef4444',
      },
      boxShadow: {
        soft: '0 10px 30px rgba(31,41,55,0.15)'
      },
      borderRadius: {
        xl: '16px'
      }
    },
  },
  plugins: [],
}
export default config
