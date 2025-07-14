/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'arabic': ['Noto Sans Arabic', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#e6f7f7',
          100: '#ccefef',
          200: '#99dfdf',
          300: '#66cfcf',
          400: '#33bfbf',
          500: '#00afaf',
          600: '#008c8c',
          700: '#006969',
          800: '#004646',
          900: '#002323',
        },
        secondary: {
          50: '#e6f7f5',
          100: '#ccefeb',
          200: '#99dfd7',
          300: '#66cfc3',
          400: '#33bfaf',
          500: '#00af9b',
          600: '#008c7c',
          700: '#00695d',
          800: '#00463e',
          900: '#00231f',
        },
        accent: {
          50: '#e6f7f2',
          100: '#ccefe5',
          200: '#99dfcb',
          300: '#66cfb1',
          400: '#33bf97',
          500: '#00af7d',
          600: '#008c64',
          700: '#00694b',
          800: '#004632',
          900: '#002319',
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'app-gradient': 'linear-gradient(135deg, #004646 0%, #006969 50%, #008c8c 100%)',
        'card-gradient': 'linear-gradient(135deg, #ffffff 0%, #e6f7f7 100%)',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        slideInRight: {
          '0%': {
            opacity: '0',
            transform: 'translateX(20px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateX(0)',
          },
        },
      },
      boxShadow: {
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        'inner-lg': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [
    function({ addUtilities }) {
      const newUtilities = {
        '.rtl\\:text-right': {
          '[dir="rtl"] &': {
            'text-align': 'right',
          },
        },
        '.rtl\\:text-left': {
          '[dir="rtl"] &': {
            'text-align': 'left',
          },
        },
        '.rtl\\:ml-0': {
          '[dir="rtl"] &': {
            'margin-left': '0',
          },
        },
        '.rtl\\:mr-3': {
          '[dir="rtl"] &': {
            'margin-right': '0.75rem',
          },
        },
        '.rtl\\:space-x-reverse > :not([hidden]) ~ :not([hidden])': {
          '[dir="rtl"] &': {
            '--tw-space-x-reverse': '1',
          },
        },
        '.rtl\\:border-l-0': {
          '[dir="rtl"] &': {
            'border-left-width': '0',
          },
        },
        '.rtl\\:border-r-4': {
          '[dir="rtl"] &': {
            'border-right-width': '4px',
          },
        },
        '.text-gradient-primary': {
          'background': 'linear-gradient(135deg, #00afaf, #008c8c)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text',
        },
        '.text-gradient-secondary': {
          'background': 'linear-gradient(135deg, #00af9b, #008c7c)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text',
        },
      }
      addUtilities(newUtilities)
    }
  ],
};