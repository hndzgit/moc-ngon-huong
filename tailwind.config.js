/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#3e5641',
          greenDark: '#2f4232',
          greenDeep: '#253528',
          cream: '#f7f4d5',
          paper: '#fbfaf5',
          paperWarm: '#f5f2ed',
          gold: '#c89f5d',
          goldLight: '#d9b578',
          red: '#c8161d',
          charcoal: '#222222',
          body: '#3d3d3d',
          muted: '#5f5c5c',
          subtle: '#6b6b6b',
          border: '#d9d9d9',
          borderDark: '#999999',
        }
      },
      fontFamily: {
        philosopher: ['"Philosopher"', 'serif'],
        montserrat: ['"Montserrat"', 'sans-serif'],
        inter: ['"Inter"', 'sans-serif'],
        serif: ['"Philosopher"', '"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Montserrat"', 'sans-serif'],
        cursive: ['"Dancing Script"', 'cursive'],
      },
      maxWidth: {
        'figma': '1680px',
      },
      boxShadow: {
        'card': '0px 4px 12px rgba(0, 0, 0, 0.08)',
        'elevated': '0px 10px 30px rgba(0, 0, 0, 0.14)',
        'drawer': '-8px 0px 32px rgba(0, 0, 0, 0.18)',
      }
    },
  },
  plugins: [],
}
