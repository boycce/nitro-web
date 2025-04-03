import defaultTheme from 'tailwindcss/defaultTheme'
import colors from 'tailwindcss/colors'
import path from 'path'
import Color from 'color'

const lighten = (clr, val) => Color(clr).lighten(val).rgb().string()
const darken = (clr, val) => Color(clr).darken(val).rgb().string()
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
    optimizeUniversalDefaults: true, // remove undesired variables from universal selectors
  },
  theme: {
    // Full list: https://github.com/tailwindlabs/tailwindcss/blob/main/stubs/config.full.js#L889
    extend: {
      boxShadow: {
        'dropdown-ul': '0 2px 8px 0 rgba(0, 0, 0, 0.05)',
      },
      colors: {
        // Main colors
        'primary': '#4c50f9',
        'primary-dark': darken('#4c50f9', 0.05),
        'primary-hover': lighten('#4c50f9', 0.05),
        'secondary': colors.green[500],
        'secondary-dark': colors.green[600],
        'secondary-hover': lighten(colors.green[500], 0.05),
        'label': colors.gray[900],
        'link': colors.black,
        'link-hover': colors.blue[200],
        'link-focus': colors.blue[200],
        'light': colors.gray[100],
        'dark': colors.gray[900],
        // Alert colors
        'critical': '#ff0000',
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
        '2xs': ['12px', { lineHeight: '1.5' }],
        'xs': ['13px', { lineHeight: '1.5' }],
        'sm': ['13.5px', { lineHeight: '1.5' }],
        'md': ['14px', { lineHeight: '1.5' }],
        'base': ['15.5px', { lineHeight: '1.5' }],
        'lg': ['18px', { lineHeight: '1.75' }],
        'xl': ['20px', { lineHeight: '1.75' }],
        '2xl': ['22.5px', { lineHeight: '1.75' }],
        '3xl': ['30px', { lineHeight: '1.75' }],
      },
      spacing: {
        'input-before': '0.625rem',
        'input-after': '1.5rem',
      },
    },
  },
  plugins: [],
}

