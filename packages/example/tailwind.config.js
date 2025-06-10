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
    // Note: No class order is guaranteed when using mulitple extension classes below on an element.
    // Full list: https://github.com/tailwindlabs/tailwindcss/blob/main/stubs/config.full.js#L889
    extend: {
      boxShadow: {
        'dropdown-ul': '0 2px 8px 0 rgba(0, 0, 0, 0.05)',
      },
      colors: {
        // Nitro main colors
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
        'foreground': colors.gray[900],
        // Nitro error & alert colors
        'critical': '#ff0000',
        'danger': '#ff0000',
        'danger-dark': colors.red[800],
        'info': colors.blue[500],
        'success': colors.green[500],
        // Nitro element colors
        'input': colors.gray[900],
        'input-placeholder': colors.gray[400],
        'input-border': colors.gray[300],
        'input-border-focus': '#4c50f9',
        'dropdown-ul-border': colors.gray[200],
        'variable-selected': '#4c50f9',
      },
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
      fontSize: {
        // Nitro font sizes 
        '3xl': ['30px', { lineHeight: '52px' }],
        '2xl': ['22.5px', { lineHeight: '39px' }],
        'xl': ['20px', { lineHeight: '35px' }],
        'lg': ['18px', { lineHeight: '31px' }],
        'base': ['15.5px', { lineHeight: '23px' }],
        'md': ['14px', { lineHeight: '21px' }],
        'sm': ['13.5px', { lineHeight: '20px' }],
        'xs': ['13px', { lineHeight: '19px' }],
        '2xs': ['12px', { lineHeight: '18px' }],
        'button-size': ['13.5px', { lineHeight: '20px' }], // defaults to text-sm
        'input-size': ['13.5px', { lineHeight: '20px' }], // defaults to text-sm
      },
      spacing: {
        // Nitro field spacing (defaults listed below)
        // 'input-before': '0.625rem',
        // 'input-after': '1.5rem',
        'input-x': '12px',
        'input-y': '9px',
        'button-x-md': '12px',
        'button-y-md': '9px',
      },
      borderRadius: {
        // 'md': '5px', // button/input
        // 'DEFAULT': '4px', // button small
      },
    },
  },
  plugins: [],
}

