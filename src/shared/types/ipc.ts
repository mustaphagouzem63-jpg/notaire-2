// ============================================================
// IPC CHANNEL DEFINITIONS — Single source of truth
// Maps channel names to request/response payload types
// ============================================================

// ── Channel Name Constants ────────────────────────────────────
export const IPC_CHANNELS = {
  // Auth
  AUTH_LOGIN: 'auth:login',
  AUTH_LOGOUT: 'auth:logout',
  AUTH_CHANGE_PASSWORD: 'auth:changePassword',
  AUTH_GET_SESSION: 'auth:getSession',

  // Clients
  CLIENTS_LIST: 'clients:list',
  CLIENTS_GET: 'clients:get',
  CLIENTS_CREATE: 'clients:create',
  CLIENTS_UPDATE: 'clients:update',
  CLIENTS_DELETE: 'clients:delete',
  CLIENTS_SEARCH: 'clients:search',

  // Contracts
  CONTRACTS_LIST: 'contracts:list',
  CONTRACTS_GET: 'contracts:get',
  CONTRACTS_CREATE: 'contracts:create',
  CONTRACTS_UPDATE: 'contracts:update',
  CONTRACTS_DELETE: 'contracts:delete',
  CONTRACTS_TRANSITION: 'contracts:transition',
  CONTRACTS_GENERATE_PDF: 'contracts:generatePdf',
  CONTRACTS_GENERATE_NUMBER: 'contracts:generateNumber',
  CONTRACTS_SEARCH: 'contracts:search',

  // Documents
  DOCUMENTS_LIST: 'documents:list',
  DOCUMENTS_GET: 'documents:get',
  DOCUMENTS_UPLOAD: 'documents:upload',
  DOCUMENTS_DELETE: 'documents:delete',
  DOCUMENTS_GET_VERSIONS: 'documents:getVersions',
  DOCUMENTS_RESTORE_VERSION: 'documents:restoreVersion',
  DOCUMENTS_RUN_OCR: 'documents:runOcr',
  DOCUMENTS_OPEN: 'documents:open',

  // Appointments
  APPOINTMENTS_LIST: 'appointments:list',
  APPOINTMENTS_GET: 'appointments:get',
  APPOINTMENTS_CREATE: 'appointments:create',
  APPOINTMENTS_UPDATE: 'appointments:update',
  APPOINTMENTS_DELETE: 'appointments:delete',
  APPOINTMENTS_BY_DATE_RANGE: 'appointments:byDateRange',
  APPOINTMENTS_CALENDAR: 'appointments:calendar',

  // Search
  SEARCH_GLOBAL: 'search:global',

  // Audit
  AUDIT_LIST: 'audit:list',
  AUDIT_EXPORT: 'audit:export',

  // Settings
  SETTINGS_GET: 'settings:get',
  SETTINGS_UPDATE: 'settings:update',
  SETTINGS_GET_ALL: 'settings:getAll',

  // Users (admin)
  USERS_LIST: 'users:list',
  USERS_GET: 'users:get',
  USERS_CREATE: 'users:create',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',
  USERS_RESET_PASSWORD: 'users:resetPassword',

  // Backup
  BACKUP_CREATE: 'backup:create',
  BACKUP_RESTORE: 'backup:restore',
  BACKUP_LIST: 'backup:list',
  BACKUP_DELETE: 'backup:delete',
  BACKUP_VALIDATE: 'backup:validate',

  // Notifications
  NOTIFICATIONS_LIST: 'notifications:list',
  NOTIFICATIONS_MARK_READ: 'notifications:markRead',
  NOTIFICATIONS_MARK_ALL_READ: 'notifications:markAllRead',
  NOTIFICATIONS_COUNT_UNREAD: 'notifications:countUnread',
  NOTIFICATIONS_GET_ALL: 'notifications:getAll',
  NOTIFICATIONS_GET_UNREAD_COUNT: 'notifications:getUnreadCount',
  NOTIFICATIONS_DELETE: 'notifications:delete',

  // Templates
  TEMPLATES_LIST: 'templates:list',
  TEMPLATES_GET: 'templates:get',
  TEMPLATES_UPDATE: 'templates:update',
  TEMPLATES_GET_BY_TYPE: 'templates:getByType',

  // Dashboard
  DASHBOARD_STATS: 'dashboard:stats',
  DASHBOARD_RECENT_ACTIVITY: 'dashboard:recentActivity',
  DASHBOARD_CHARTS: 'dashboard:charts',

  // Dialog & System
  DIALOG_OPEN_FILE: 'dialog:openFile',
  DIALOG_SAVE_FILE: 'dialog:saveFile',
  DIALOG_SELECT_DIRECTORY: 'dialog:selectDirectory',
  SYSTEM_SHOW_ERROR: 'system:showError',
  SYSTEM_SHOW_MESSAGE: 'system:showMessage',
  SYSTEM_COPY_FILE_TO: 'system:copyFileTo',
} as const

export type IpcChannel = typeof IPC_CHANNELS[keyof typeof IPC_CHANNELS]

// All valid channel names for whitelist validation
export const ALL_CHANNELS: string[] = Object.values(IPC_CHANNELS)
