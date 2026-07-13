import { useAuth } from './useAuth'

export function usePermission() {
  const { user } = useAuth()
  
  const hasPermission = (permission: string) => {
    if (!user) return false
    if (user.role === 'admin') return true
    
    // In a real app, you would check a specific permissions array from the user object
    // Or map roles to specific permissions. For simplicity here:
    if (user.role === 'manager') {
      const restricted = ['delete_users', 'manage_settings', 'delete_audit_logs']
      return !restricted.includes(permission)
    }
    
    if (user.role === 'clerk') {
      const allowed = ['view_clients', 'create_clients', 'view_contracts', 'create_contracts', 'view_documents', 'upload_documents']
      return allowed.includes(permission)
    }
    
    return false
  }

  const isRole = (role: string | string[]) => {
    if (!user) return false
    if (Array.isArray(role)) return role.includes(user.role)
    return user.role === role
  }

  return { hasPermission, isRole }
}
