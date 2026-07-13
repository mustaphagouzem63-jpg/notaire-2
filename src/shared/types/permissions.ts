// ============================================================
// PERMISSION DEFINITIONS — Role → Permission Matrix
// ============================================================

import { UserRole } from './enums'

export type Module = 'clients' | 'contracts' | 'documents' | 'appointments' | 'users' | 'settings' | 'audit' | 'backup' | 'templates' | 'dashboard'

export type Action = 'view' | 'create' | 'update' | 'delete' | 'approve' | 'finalize' | 'export' | 'manage'

export type PermissionKey = `${Module}.${Action}`

// The complete permission matrix
export const PERMISSION_MATRIX: Record<UserRole, Set<PermissionKey>> = {
  [UserRole.ADMIN]: new Set([
    // Full access
    'clients.view', 'clients.create', 'clients.update', 'clients.delete',
    'contracts.view', 'contracts.create', 'contracts.update', 'contracts.delete', 'contracts.approve', 'contracts.finalize', 'contracts.export',
    'documents.view', 'documents.create', 'documents.update', 'documents.delete',
    'appointments.view', 'appointments.create', 'appointments.update', 'appointments.delete',
    'users.view', 'users.create', 'users.update', 'users.delete', 'users.manage',
    'settings.view', 'settings.manage',
    'audit.view', 'audit.export',
    'backup.view', 'backup.create', 'backup.manage',
    'templates.view', 'templates.update',
    'dashboard.view',
  ]),

  [UserRole.NOTARY]: new Set([
    'clients.view', 'clients.create', 'clients.update',
    'contracts.view', 'contracts.create', 'contracts.update', 'contracts.approve', 'contracts.finalize', 'contracts.export',
    'documents.view', 'documents.create', 'documents.update',
    'appointments.view', 'appointments.create', 'appointments.update', 'appointments.delete',
    'audit.view',
    'backup.view', 'backup.create',
    'templates.view', 'templates.update',
    'dashboard.view',
  ]),

  [UserRole.CLERK]: new Set([
    'clients.view', 'clients.create', 'clients.update',
    'contracts.view', 'contracts.create', 'contracts.update', 'contracts.export',
    'documents.view', 'documents.create', 'documents.update',
    'appointments.view', 'appointments.create', 'appointments.update',
    'templates.view',
    'dashboard.view',
  ]),

  [UserRole.ASSISTANT]: new Set([
    'clients.view', 'clients.create', 'clients.update',
    'contracts.view',
    'documents.view', 'documents.create',
    'appointments.view', 'appointments.create', 'appointments.update', 'appointments.delete',
    'dashboard.view',
  ]),

  [UserRole.AUDITOR]: new Set([
    'clients.view',
    'contracts.view', 'contracts.export',
    'documents.view',
    'appointments.view',
    'audit.view', 'audit.export',
    'dashboard.view',
  ]),
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: PermissionKey): boolean {
  return PERMISSION_MATRIX[role]?.has(permission) ?? false
}

/**
 * Get all permissions for a role
 */
export function getPermissionsForRole(role: UserRole): PermissionKey[] {
  return Array.from(PERMISSION_MATRIX[role] ?? [])
}
