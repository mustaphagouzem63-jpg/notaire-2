import React from 'react'
import { Badge } from '../ui/Badge'
import { useTranslation } from 'react-i18next'

interface StatusBadgeProps {
  status: string
  type: 'contract' | 'appointment' | 'general'
  className?: string
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type, className = '' }) => {
  const { t } = useTranslation()
  
  if (type === 'contract') {
    switch (status) {
      case 'draft':
        return <Badge variant="default" className={className}>{t('contracts.status_draft')}</Badge>
      case 'review':
        return <Badge variant="warning" className={className}>{t('contracts.status_review')}</Badge>
      case 'approved':
        return <Badge variant="primary" className={className}>{t('contracts.status_approved')}</Badge>
      case 'finalized':
        return <Badge variant="success" className={className}>{t('contracts.status_finalized')}</Badge>
      default:
        return <Badge variant="outline" className={className}>{status}</Badge>
    }
  }
  
  if (type === 'appointment') {
    switch (status) {
      case 'scheduled':
        return <Badge variant="primary" className={className}>Programmée / مجدولة</Badge>
      case 'confirmed':
        return <Badge variant="success" className={className}>Confirmée / مؤكدة</Badge>
      case 'cancelled':
        return <Badge variant="danger" className={className}>Annulée / ملغاة</Badge>
      case 'completed':
        return <Badge variant="default" className={className}>Terminée / مكتملة</Badge>
      default:
        return <Badge variant="outline" className={className}>{status}</Badge>
    }
  }

  // General fallback
  const isPositive = ['active', 'success', 'completed'].includes(status)
  const isNegative = ['inactive', 'error', 'failed', 'cancelled'].includes(status)
  const isWarning = ['pending', 'warning', 'review'].includes(status)
  
  let variant: 'success' | 'danger' | 'warning' | 'default' = 'default'
  if (isPositive) variant = 'success'
  if (isNegative) variant = 'danger'
  if (isWarning) variant = 'warning'

  return <Badge variant={variant} className={className}>{status}</Badge>
}
