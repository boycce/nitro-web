import defaultTheme from 'tailwindcss/defaultTheme'
import colors from 'tailwindcss/colors'
import path from 'path'
import Color from 'color'
import nitroTheme, { v } from 'nitro-web/tailwind'

const lighten = (clr, val) => Color(clr).lighten(val).rgb().string()
// const darken = (clr, val) => Color(clr).darken(val).rgb().string()
const nitroDir = path.dirname(require.resolve('nitro-web'))

const projectColors = {
  // list project colors here
  'status-indigo': '#4b59f2',
  'status-blue': '#106efb',
  'border-1': '#E7E7E7',
  //...
}

export default {
  darkMode: 'class',
  content: {
    relative: true,
    files: [
      './components/**/*.{ts,tsx}',
      './client/**/*.{ts,tsx}',
      './server/constants.js',
      './server/util.js',
      path.join(nitroDir, '../components/**/*.{ts,tsx}'),
    ],
  },
  experimental: {
    optimizeUniversalDefaults: true, // remove undesired variables from universal selectors
  },
  theme: {
    // Note: No class order is guaranteed when using mulitple extension classes below on an element.
    // Full list: https://github.com/tailwindlabs/tailwindcss/blob/v3.4.19/stubs/config.full.js#L889
    extend: {
      boxShadow: {
        'dropdown-ul': '0 2px 8px 0 rgba(0, 0, 0, 0.05)',
        'button': defaultTheme.boxShadow.sm,
      },
      colors: {
        // Nitro main colors
        'primary': '#4c50f9',
        'primary-hover': lighten('#4c50f9', 0.05),
        'secondary': colors.green[500],
        'secondary-hover': lighten(colors.green[500], 0.05),
        'label': v('foreground'),
        'link': v('foreground'),
        'link-hover': colors.blue[200],
        'link-focus': colors.blue[200],
        // Nitro feedback colors
        'danger': colors.red[500],
        'danger-foreground': colors.red[600],
        'danger-hover': lighten(colors.red[500], 0.05),
        'warning': colors.yellow[500],
        'warning-hover': lighten(colors.yellow[500], 0.05),
        'info': colors.blue[500],
        'info-hover': lighten(colors.blue[500], 0.05),
        'success': colors.green[500],
        'success-hover': lighten(colors.green[500], 0.05),
        // Nitro element colors
        'input': v('foreground'),
        'input-border-focus': '#4c50f9',
        'dropdown-selected-foreground': v('primary-text'),
        'dropdown-ul-border': v('border'),
        'variable-selected': '#4c50f9',
        // 'input-icon': '#c6c8ce', // optional
        // project colors
        ...projectColors,
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
        'button-base': ['13.5px', { lineHeight: '20px' }],
        'input-base': ['13.5px', { lineHeight: '20px' }],
      },
      spacing: {
        // Nitro field spacing values (defaults listed below)
        // 'input-x': '12px',
        // 'input-x-icon': '32px',
        // 'input-y': '9px',
        // 'input-before': '0.625rem',
        // 'input-after': '1.5rem',
        // 'input-icon': '14px',
      },
      borderRadius: {
        // 'md': '5px', // button/input
        // 'DEFAULT': '4px', // button small
      },
      borderColor: {
        'DEFAULT': v('border'),
      },
    },
  },
  plugins: [
    // Theme colours per mode, each key becomes a css variable and a tailwind colour, omitted keys use the nitro defaults
    nitroTheme({
      light: {
        'background': '#fdfdfd',
        'foreground': '#111827',
        'surface': '#ffffff', // cards, sidebar, dropdowns, modals
        'muted': '#f9fafb', // hover rows
        'accent': '#f3f4f6', // selected options, chips, a step above muted
        'muted-foreground': '#6b7280',
        'border': '#e7e7e7', // lines
        'input-border': '#d1d5db',
        'input-placeholder': '#9ca3af',
        'input-disabled': '#9ca3af',
        'input-bg': '#ffffff',
        'input-disabled-bg': '#f3f4f6',
        'overlay': '#6b7280', // used with opacity, e.g. bg-overlay/70
        'primary-text': '#4c50f9', // primary used as text, e.g. sidebar active link
      },
      dark: {
        'background': '#09090b',
        'foreground': '#fafafa',
        'surface': '#18181b',
        'muted': '#27272a',
        'accent': '#303035',
        'muted-foreground': '#a1a1aa',
        'border': '#3a3a40',
        'input-border': '#3a3a40',
        'input-placeholder': '#71717a',
        'input-disabled': '#71717a',
        'input-bg': '#1c1c1f',
        'input-disabled-bg': '#27272a',
        'overlay': '#000000',
        'primary-text': '#818cf8',
      },
    }),
  ],
}

