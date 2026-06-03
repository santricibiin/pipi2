/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-jakarta)', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['ui-monospace', 'SF Mono', 'Menlo', 'Consolas', 'monospace'],
      },
      colors: {
        navy: { DEFAULT: '#1a1a2e', 2: '#16213e' },
        ink: '#1a1a2e',
        muted: '#6b7280',
        surface: { DEFAULT: '#ffffff', 2: '#fafafa' },
        border: '#f0f0f0',
        accent: { DEFAULT: '#f97316', light: '#fff7ed', hover: '#ea580c', soft: '#fed7aa' },
      },
    },
  },
  plugins: [],
}
