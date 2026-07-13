import React from 'react'
import { Modal } from './Modal'
import { Button } from './Button'
import { useTranslation } from 'react-i18next'

export interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string | React.ReactNode
  confirmText?: string
  cancelText?: string
  isDestructive?: boolean
  isLoading?: boolean
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  isDestructive = false,
  isLoading = false
}) => {
  const { t } = useTranslation()

  const footer = (
    <>
      <Button variant="ghost" onClick={onClose} disabled={isLoading}>
        {cancelText || t('common.cancel')}
      </Button>
      <Button 
        variant={isDestructive ? 'danger' : 'primary'} 
        onClick={onConfirm} 
        isLoading={isLoading}
      >
        {confirmText || t('common.confirm')}
      </Button>
    </>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={footer}
    >
      <div className="py-2 text-slate-600 dark:text-slate-300">
        {message}
      </div>
    </Modal>
  )
}
