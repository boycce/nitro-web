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
        // Nitro colors
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
        '2xs': ['12px', { lineHeight: '1.5' }],
        'xs': ['13px', { lineHeight: '1.5' }],
        'sm': ['13.5px', { lineHeight: '1.5' }],
        'md': ['14px', { lineHeight: '1.5' }],
        'base': ['15.5px', { lineHeight: '1.5' }],
        'lg': ['18px', { lineHeight: '1.75' }],
        'xl': ['20px', { lineHeight: '1.75' }],
        '2xl': ['22.5px', { lineHeight: '1.75' }],
        '3xl': ['30px', { lineHeight: '1.75' }],
        // 'sm-button': ['13.5px', { lineHeight: '1.5' }], // defaults to text-sm
        // 'sm-input': ['13.5px', { lineHeight: '1.5' }], // defaults to text-sm
      },
      spacing: {
        // Nitro field spacing (defaults listed below)
        // 'input-before': '0.625rem',
        // 'input-after': '1.5rem',
        // 'input-x': '0.75rem',
        // 'input-y': '0.58rem',
        // 'button-x-md': '0.75rem',
        // 'button-y-md': '0.58rem',
      },
    },
  },
  plugins: [],
}

