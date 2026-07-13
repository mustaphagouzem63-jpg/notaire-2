import React from 'react'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', label, error, helperText, id, ...props }, ref) => {
    
    const textareaId = id || React.useId()
    
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={textareaId} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            {label}
          </label>
        )}
        
        <textarea
          ref={ref}
          id={textareaId}
          className={`
            flex min-h-[80px] w-full rounded-md border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm 
            placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50
            dark:bg-slate-900/50 dark:text-slate-50
            transition-colors
            ${error ? 'border-rose-500 focus:ring-rose-500' : ''}
            ${className}
          `}
          {...props}
        />
        
        {error && <p className="mt-1.5 text-sm text-rose-500">{error}</p>}
        {helperText && !error && <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{helperText}</p>}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
