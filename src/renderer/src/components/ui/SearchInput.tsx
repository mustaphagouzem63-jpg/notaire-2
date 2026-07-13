import React, { useState, useEffect } from 'react'
import { Input } from './Input'
import { useDebounce } from '../../hooks/useDebounce'
import { useTranslation } from 'react-i18next'

export interface SearchInputProps {
  onSearch: (query: string) => void
  placeholder?: string
  className?: string
  debounceTime?: number
  initialValue?: string
}

export const SearchInput: React.FC<SearchInputProps> = ({
  onSearch,
  placeholder,
  className = '',
  debounceTime = 300,
  initialValue = ''
}) => {
  const [value, setValue] = useState(initialValue)
  const debouncedValue = useDebounce(value, debounceTime)
  const { t } = useTranslation()
  const defaultPlaceholder = t('common.search', 'Rechercher... / بحث...')

  useEffect(() => {
    // Only call onSearch if it's not the initial mount with empty string
    // Or if initialValue was provided and it changed
    if (debouncedValue !== initialValue || debouncedValue !== '') {
      onSearch(debouncedValue)
    }
  }, [debouncedValue, onSearch])

  const handleClear = () => {
    setValue('')
    onSearch('')
  }

  return (
    <div className={`relative ${className}`}>
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder || defaultPlaceholder}
        leftIcon={
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        }
        rightIcon={
          value ? (
            <button 
              onClick={handleClear}
              className="rounded-full p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          ) : undefined
        }
      />
    </div>
  )
}
