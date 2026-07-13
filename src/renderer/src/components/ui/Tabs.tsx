import React, { useState } from 'react'

export interface Tab {
  id: string
  label: string
  icon?: React.ReactNode
  content?: React.ReactNode
}

export interface TabsProps {
  tabs: Tab[]
  defaultTabId?: string
  activeTab?: string
  onChange?: (tabId: string) => void
  onTabChange?: (tabId: string) => void
  className?: string
}

export const Tabs: React.FC<TabsProps> = ({ 
  tabs, 
  defaultTabId, 
  activeTab: controlledActiveTab,
  onChange,
  onTabChange,
  className = '' 
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState(defaultTabId || tabs[0]?.id)
  
  const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab

  const handleTabClick = (id: string) => {
    if (controlledActiveTab === undefined) {
      setInternalActiveTab(id)
    }
    if (onChange) onChange(id)
    if (onTabChange) onTabChange(id)
  }

  return (
    <div className={`w-full flex flex-col ${className}`}>
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-6 rtl:space-x-reverse overflow-x-auto" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`
                  whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2
                  ${isActive 
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400' 
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300 dark:hover:border-slate-700'
                  }
                `}
                aria-current={isActive ? 'page' : undefined}
              >
                {tab.icon}
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>
      
      <div className="mt-4 focus:outline-none">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={activeTab === tab.id ? 'block animate-in fade-in duration-300' : 'hidden'}
          >
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  )
}
