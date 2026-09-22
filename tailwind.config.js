/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'space-bg': '#0B0E1A',
        'space-surface': '#141829',
        'space-surface-2': '#1B2036',
        'space-text': '#E8EAF2',
        'space-muted': '#8B93AC',
        'space-accent': '#6EE7C0',
        'space-warm': '#F2B84B',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}

