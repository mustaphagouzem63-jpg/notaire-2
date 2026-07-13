import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../hooks/useTheme'
import { useToast } from '../../hooks/useToast'
import { SearchInput } from '../ui/SearchInput'

export const Header: React.FC = () => {
  const { t } = useTranslation()
  const { user, logout, token } = useAuth()
  const { theme, toggleTheme, language, setLanguage } = useTheme()
  const { showToast } = useToast()
  const navigate = useNavigate()
  
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleGlobalSearch = async (query: string) => {
    if (!query || query.length < 2) return
    
    try {
      // We would normally route to a search results page or show a dropdown
      // For now, we'll just log it or show a toast if we implemented it fully
      const results = await window.api.globalSearch(query, { user, token })
      if (results && results.length > 0) {
        showToast({
          type: 'success',
          title: 'Search Complete',
          message: `Found ${results.length} results. (Search page to be implemented)`
        })
      } else {
        showToast({
          type: 'info',
          title: 'No Results',
          message: 'Could not find any matching records.'
        })
      }
    } catch (error) {
      console.error(error)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const toggleLanguage = () => {
    setLanguage(language === 'fr' ? 'ar' : 'fr')
  }

  return (
    <header className="h-16 glass border-b flex items-center justify-between px-6 shrink-0 relative z-10 w-full">
      <div className="flex-1 max-w-xl">
        <SearchInput 
          onSearch={handleGlobalSearch} 
          placeholder={t('common.search')}
          className="w-full max-w-md"
        />
      </div>
      
      <div className="flex items-center gap-4">
        {/* Language Toggle */}
        <button 
          onClick={toggleLanguage}
          className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium text-sm text-slate-700 dark:text-slate-300"
          title="Toggle Language"
        >
          {language === 'fr' ? 'ع' : 'FR'}
        </button>
        
        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300"
          title="Toggle Theme"
        >
          {theme === 'dark' ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
          )}
        </button>
        
        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 p-1.5 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 flex items-center justify-center font-bold">
              {user?.full_name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="hidden sm:block text-left rtl:text-right">
              <p className="text-sm font-medium leading-none mb-1">{user?.full_name}</p>
              <p className="text-xs text-muted-foreground leading-none capitalize">{user?.role}</p>
            </div>
          </button>
          
          {isProfileOpen && (
            <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-lg py-1 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-2 border-b border-border sm:hidden">
                <p className="text-sm font-medium">{user?.full_name}</p>
                <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
              </div>
              <button 
                onClick={() => { setIsProfileOpen(false); navigate('/settings') }}
                className="w-full text-left rtl:text-right px-4 py-2 text-sm text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                {t('nav.settings')}
              </button>
              <button 
                onClick={handleLogout}
                className="w-full text-left rtl:text-right px-4 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-colors flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
                {t('nav.logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
