import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { twMerge } from 'nitro-web'

export type Theme = 'light' | 'dark'

// Theme already applied by the index.html script, else saved, else the OS preference
export function getTheme(): Theme {
  if (document.documentElement.classList.contains('dark')) return 'dark'
  const saved = localStorage.getItem('theme') as Theme | null
  return saved || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
}

// Applies the theme to <html> and persists it
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getTheme)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme == 'dark')
    localStorage.setItem('theme', theme)
  }, [theme])
  const toggle = () => setTheme(theme == 'dark' ? 'light' : 'dark')
  return { theme, setTheme, toggle }
}

export function ThemeToggle({ className, size=18 }: { className?: string, size?: number }) {
  const { theme, toggle } = useTheme()
  return (
    <button
      type="button"
      onClick={toggle}
      title="Toggle theme"
      class={twMerge('p-2 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground', className)}
    >
      {theme == 'dark' ? <Sun size={size} /> : <Moon size={size} />}
    </button>
  )
}
