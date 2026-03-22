import { fontFamily } from 'tailwindcss/defaultTheme';

module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    colors: {
      dark: '#221208',
      light: '#F2F2E8',
      primaria: '#82AADE',
      secundaria: '#E9D3DF',
      terciaria: '#9DACD7',
      quartenaria: '#FBE2DB',
      contatoSection: '#F2F2E8',
      gradientHero:
        'linear-gradient(to bottom, rgba(130, 170, 222, 1) 60%, rgba(157, 172, 215, 1) 80%',
      gradientEstudos:
        'linear-gradient(to bottom, rgba(157, 172, 215, 1) 60%, rgba(233, 211, 223, 1) 92%',
      gradientProjetos:
        'linear-gradient(to bottom, rgba(233, 211, 223, 1) 60%, rgba(251, 226, 219, 1) 85%',
      gradientSobre:
        'linear-gradient(to bottom, rgba(251, 226, 219, 1) 60%, rgba(242, 242, 232, 1) 85%',
    },
    extend: {
      fontFamily: {
        sans: ['Inter', ...fontFamily.sans],
      },
      keyframes: {
        twinkle: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.8' },
          '50%': { transform: 'scale(2)', opacity: '1' },
        },
        slideUp: {
          '0%': {
            transform: 'translateY(40px)',
            opacity: '0',
          },
          '100%': {
            transform: 'translateY(0)',
            opacity: '1',
          },
        },
      },
      animation: {
        twinkle: 'twinkle 1.5s ease-in-out infinite',
        slideUp: 'slideUp 0.4s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate'), require('tailwindcss-text-stroke')],
};
