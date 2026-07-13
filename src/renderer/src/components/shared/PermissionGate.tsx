import React from 'react'
import { usePermission } from '../../hooks/usePermission'

interface PermissionGateProps {
  permission?: string
  role?: string | string[]
  children: React.ReactNode
  fallback?: React.ReactNode
}

export const PermissionGate: React.FC<PermissionGateProps> = ({ 
  permission, 
  role, 
  children, 
  fallback = null 
}) => {
  const { hasPermission, isRole } = usePermission()

  const hasAccess = () => {
    // If both are provided, user must satisfy both
    if (permission && role) {
      return hasPermission(permission) && isRole(role)
    }
    
    if (permission) {
      return hasPermission(permission)
    }
    
    if (role) {
      return isRole(role)
    }
    
    return true
  }

  return hasAccess() ? <>{children}</> : <>{fallback}</>
}
