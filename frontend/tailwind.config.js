/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: '#F7F8F4',
          subtle: '#FAFBF8',
          card: '#FFFFFF',
          dark: '#EEF0E7',
        },
        ink: {
          DEFAULT: '#19231B',
          muted: '#4B5A4E',
          subtle: '#78897C',
          faint: '#A6B3A9',
        },
        agri: {
          border: '#E1E5DC',
          'border-strong': '#CAD0C3',
          neutral: '#EFF2EA',
        },
        pine: {
          DEFAULT: '#1E3C2C',
          dark: '#142A1E',
          light: '#2B543E',
          surface: '#EBF1ED',
        },
        moss: {
          DEFAULT: '#3B6E48',
          light: '#4E8A5D',
          dark: '#2A5134',
          surface: '#EEF5EF',
        },
        amber: {
          DEFAULT: '#C67D22',
          light: '#DE9437',
          dark: '#9A5E13',
          surface: '#FDF5EC',
        },
        rust: {
          DEFAULT: '#B84B28',
          light: '#CE5E38',
          dark: '#8C3519',
          surface: '#FAF0EB',
        },
        deeprust: {
          DEFAULT: '#8C2820',
          light: '#A5382F',
          dark: '#661B15',
          surface: '#F8ECEB',
        }
      },
      fontFamily: {
        heading: ['"Space Grotesk"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"Space Grotesk"', 'monospace']
      },
      boxShadow: {
        'clean': '0 1px 3px 0 rgba(25, 35, 27, 0.05), 0 1px 2px -1px rgba(25, 35, 27, 0.04)',
        'clean-md': '0 4px 6px -1px rgba(25, 35, 27, 0.06), 0 2px 4px -2px rgba(25, 35, 27, 0.04)',
        'clean-lg': '0 10px 15px -3px rgba(25, 35, 27, 0.07), 0 4px 6px -4px rgba(25, 35, 27, 0.05)',
      }
    },
  },
  plugins: [],
}
