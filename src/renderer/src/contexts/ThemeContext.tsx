import React, { createContext, useContext, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from './AuthContext'

type Theme = 'light' | 'dark'
type Language = 'fr' | 'ar'
type Direction = 'ltr' | 'rtl'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  language: Language
  setLanguage: (lang: Language) => void
  dir: Direction
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light')
  const [language, setLanguageState] = useState<Language>('fr')
  const { i18n } = useTranslation()
  const { user } = useAuth()

  // Initialize from local storage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('notary_theme') as Theme
    if (savedTheme) {
      setThemeState(savedTheme)
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setThemeState('dark')
    }

    const savedLang = localStorage.getItem('notary_language') as Language
    if (savedLang) {
      setLanguageState(savedLang)
      i18n.changeLanguage(savedLang)
    }
  }, [i18n])

  // Sync with user preferences if logged in
  useEffect(() => {
    if (user) {
      if (user.theme_preference && user.theme_preference !== theme) {
        setThemeState(user.theme_preference as Theme)
      }
      if (user.language_preference && user.language_preference !== language) {
        setLanguageState(user.language_preference as Language)
        i18n.changeLanguage(user.language_preference)
      }
    }
  }, [user])

  // Apply theme to document
  useEffect(() => {
    const root = window.document.documentElement
    
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
    
    localStorage.setItem('notary_theme', theme)
  }, [theme])

  // Apply language to document
  useEffect(() => {
    localStorage.setItem('notary_language', language)
  }, [language])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
  }

  const toggleTheme = () => {
    setThemeState(prev => prev === 'light' ? 'dark' : 'light')
  }

  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang)
    i18n.changeLanguage(newLang)
  }

  const dir: Direction = language === 'ar' ? 'rtl' : 'ltr'

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, language, setLanguage, dir }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
