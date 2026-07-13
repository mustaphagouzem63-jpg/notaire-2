import React from 'react'
import { useTranslation } from 'react-i18next'

interface EmptyStateProps {
  title?: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
  className?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  className = ''
}) => {
  const { t } = useTranslation()
  
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center min-h-[300px] border-2 border-dashed border-border rounded-xl bg-slate-50/50 dark:bg-slate-900/50 ${className}`}>
      <div className="text-slate-400 dark:text-slate-500 mb-4 bg-slate-100 dark:bg-slate-800 p-4 rounded-full">
        {icon || (
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        )}
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {title || 'Aucun résultat / لا توجد نتائج'}
      </h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-6">
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  )
}
