import { useEffect, useState } from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'
import { injectedConfig, twMerge } from 'nitro-web'

export type Theme = 'light' | 'dark'
export type ThemePref = Theme | 'system'

// Saved preference (namespaced per app, since dev shares localhost), else the config default (env), else light
function getPref(): ThemePref {
  return (localStorage.getItem(injectedConfig.themeName) || injectedConfig.theme || 'light') as ThemePref
}

// Resolves 'system' to the OS preference
function resolvePref(pref: ThemePref): Theme {
  if (pref == 'system') return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  return pref == 'dark' ? 'dark' : 'light'
}

// The applied light/dark theme
export function getTheme(): Theme {
  return resolvePref(getPref())
}

// Applies the theme class to <html>, called in setupApp before React mounts
export function applyTheme() {
  document.documentElement.classList.toggle('dark', getTheme() == 'dark')
}

// Applies the theme to <html> and persists the preference. Cycles light -> dark -> system.
export function useTheme() {
  const [pref, setTheme] = useState<ThemePref>(getPref)
  useEffect(() => {
    localStorage.setItem(injectedConfig.themeName, pref)
    applyTheme()
  }, [pref])
  const order: ThemePref[] = ['light', 'dark', 'system']
  const toggle = () => setTheme(order[(order.indexOf(pref) + 1) % order.length])
  const theme = resolvePref(pref)
  return { theme, pref, setTheme, toggle }
}

export function ThemeToggle({ className, size=18 }: { className?: string, size?: number }) {
  const { pref, toggle } = useTheme()
  const Icon = pref == 'system' ? Monitor : pref == 'dark' ? Moon : Sun
  return (
    <button
      type="button"
      onClick={toggle}
      title={`Theme: ${pref}`}
      class={twMerge('p-2 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground', className)}
    >
      <Icon size={size} />
    </button>
  )
}
