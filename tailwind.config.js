/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Lora', 'Georgia', 'serif'],
        sans:  ['DM Sans', 'sans-serif'],
      },
      colors: {
        beige: {
          DEFAULT: '#F2EDE3',
          mid:     '#EDE6D8',
          dark:    '#E8E0D0',
        },
        ink: {
          DEFAULT: '#1A1714',
          light:   '#3D3830',
          muted:   '#7A7166',
          faint:   '#B5ADA0',
        },
        accent: {
          gold:   '#C4922A',
          coral:  '#D4604A',
          green:  '#4A7C59',
          indigo: '#4A5580',
          rust:   '#B85C38',
          ocean:  '#2A7BAD',
          purple: '#7B5EA7',
        },
      },
      borderRadius: {
        px: '2px',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}