// https://github.com/tailwindlabs/tailwindcss/blob/main/stubs/config.full.js#L889
import defaultTheme from 'tailwindcss/defaultTheme'
import colors from 'tailwindcss/colors'
import path from 'path'
import Color from 'color'
const lighten = (clr, val) => Color(clr).lighten(val).rgb().string()
const nitroDir = path.dirname(require.resolve('nitro-web'))

export default {
  content: {
    relative: true,
    files: [
      './components/**/*.{ts,tsx}',
      path.join(nitroDir, '../components/**/*.{ts,tsx}'),
    ],
  },
  experimental: {
    optimizeUniversalDefaults: true, // remove unneeded varables from universal selectors
  },
  theme: {
    extend: {
      // Nitro theme variables
      boxShadow: {
        'dropdown-ul': '0 2px 8px 0 rgba(0, 0, 0, 0.05)',
      },
      colors: {
        // Main colors
        'primary': colors.indigo[500],
        'primary-dark': colors.indigo[600],
        'primary-light': colors.indigo[400],
        'primary-hover': lighten(colors.indigo[500], 0.05),
        'secondary': colors.green[500],
        'secondary-dark': colors.green[600],
        'secondary-light': colors.green[400],
        'secondary-hover': lighten(colors.green[500], 0.05),
        'label': colors.gray[900],
        'link': colors.black,
        'link-hover': colors.blue[200],
        'link-focus': colors.blue[200],
        'light': colors.gray[100],
        'dark': colors.gray[900],
        // Alert colors
        'danger': '#ff0000',
        'danger-dark': colors.red[800],
        'info': colors.blue[500],
        'success': colors.green[500],
        // Element colors
        'input': colors.gray[900],
        'input-placeholder': colors.gray[400],
        'input-border': colors.gray[300],
        'dropdown-ul-border': colors.gray[200],
      },
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
      fontSize: {
        '2xs': ['0.77rem', { lineHeight: '1.5' }],
        'xs': ['0.83rem', { lineHeight: '1.5' }],
        'sm-label': ['0.87rem', { lineHeight: '1.5' }],
        'sm': ['0.90rem', { lineHeight: '1.5' }],
        'base': ['1rem', { lineHeight: '1.5' }],
        'lg': ['1.16rem', { lineHeight: '1.75' }],
        'xl': ['1.29rem', { lineHeight: '1.75' }],
        '2xl': ['1.45rem', { lineHeight: '1.75' }],
        '3xl': ['1.94rem', { lineHeight: '1.75' }],
      },
      spacing: {
        'input-before': '0.625rem',
        'input-after': '1.5rem',
      },
    },
  },
  plugins: [],
}

