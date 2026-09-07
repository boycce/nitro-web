import plugin from 'tailwindcss/plugin'

/**
 * Nitro theme plugin. Every key in light/dark becomes a CSS variable (:root / .dark) and a tailwind colour,
 * e.g. 'surface' -> --surface, bg-surface, text-surface/50. Anything omitted uses the defaults below, and you
 * can add your own keys.
 *   plugins: [nitroTheme({ dark: { 'primary-text': '#818cf8' } })]
 */
export const themeDefaults = {
  light: {
    'background': '#fdfdfd',
    'foreground': '#111827', // gray-900
    'surface': '#ffffff', // cards, sidebar, dropdowns, modals
    'muted': '#f9fafb', // hover rows, selected options (gray-50)
    'muted-foreground': '#6b7280', // gray-500
    'border': '#e5e7eb', // lines, gray-200
    'input-border': '#d1d5db', // gray-300
    'input-bg': '#ffffff',
    'input-disabled-bg': '#f3f4f6', // gray-100
    'overlay': '#6b7280', // used with opacity, e.g. bg-overlay/70
    'primary-text': undefined, // primary used as text, defaults to colors.primary
    'initials': ['#067306', '#aa33ff', '#ff54af', '#f44336', '#c03c3c', '#5451e0', '#d88c1b'], // <Initials /> palette
  },
  dark: {
    'background': '#09090b', // zinc-950
    'foreground': '#fafafa', // zinc-50
    'surface': '#18181b', // zinc-900
    'muted': '#27272a', // zinc-800
    'muted-foreground': '#a1a1aa', // zinc-400
    'border': '#3a3a40',
    'input-border': '#3a3a40',
    'input-bg': '#1c1c1f',
    'input-disabled-bg': '#27272a',
    'overlay': '#000000',
    'primary-text': undefined,
    'initials': ['#4ade80', '#c084fc', '#f472b6', '#f87171', '#fb923c', '#818cf8', '#facc15'],
  },
}

// '#rgb' | '#rrggbb' | 'rgb(r, g, b)' -> 'r g b'
function channels(color) {
  const hex = color.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)?.[1]
  if (hex) {
    const full = hex.length == 3 ? hex.split('').map(c => c + c).join('') : hex
    return full.match(/../g).map(h => parseInt(h, 16)).join(' ')
  }
  const rgb = color.match(/\d+/g)
  if (rgb?.length >= 3) return rgb.slice(0, 3).join(' ')
  throw new Error(`nitroTheme: unsupported colour '${color}', use hex or rgb()`)
}

// Colour token that reads its variable, with tailwind opacity support
export const v = (name) => `rgb(var(--${name}) / <alpha-value>)`

export default function nitroTheme(options = {}) {
  const keys = new Set([...Object.keys(themeDefaults.light), ...Object.keys(options.light || {}), ...Object.keys(options.dark || {})])
  keys.delete('initials')
  const colors = Object.fromEntries([...keys].map(key => [key, v(key)]))

  return plugin(({ addBase, theme }) => {
    const vars = (mode) => {
      const t = { ...themeDefaults[mode], ...(options[mode] || {}) }
      const out = { 'color-scheme': mode }
      for (const [key, value] of Object.entries(t)) {
        if (key == 'initials') value.forEach((c, i) => out[`--initials-${i + 1}`] = channels(c))
        else if (key == 'primary-text') out['--primary-text'] = channels(value || theme('colors.primary'))
        else out[`--${key}`] = channels(value)
      }
      return out
    }
    addBase({ ':root': vars('light'), '.dark': vars('dark') })
  }, {
    theme: { extend: { colors } },
  })
}
