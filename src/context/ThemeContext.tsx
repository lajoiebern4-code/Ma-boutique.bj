import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

export type ThemeMode = 'system' | 'light' | 'dark'

type ThemeContextType = {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const STORAGE_KEY = 'chinashop-theme'

function getThemeInitial(): ThemeMode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)

    if (saved === 'system' || saved === 'light' || saved === 'dark') {
      return saved
    }
  } catch {
    // localStorage indisponible
  }

  return 'system'
}

function appliquerTheme(theme: ThemeMode) {
  const root = document.documentElement

  root.dataset.theme = theme

  if (theme === 'dark') {
    root.classList.add('dark')
    return
  }

  if (theme === 'light') {
    root.classList.remove('dark')
    return
  }

  const sombre = window.matchMedia('(prefers-color-scheme: dark)').matches

  root.classList.toggle('dark', sombre)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(getThemeInitial)

  useEffect(() => {
    appliquerTheme(theme)

    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // localStorage indisponible
    }
  }, [theme])

  useEffect(() => {
    if (theme !== 'system') return

    const media = window.matchMedia('(prefers-color-scheme: dark)')

    const actualiser = () => appliquerTheme('system')

    media.addEventListener?.('change', actualiser)

    return () => {
      media.removeEventListener?.('change', actualiser)
    }
  }, [theme])

  const setTheme = (nouveauTheme: ThemeMode) => {
    setThemeState(nouveauTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useTheme doit être utilisé dans ThemeProvider')
  }

  return context
}
