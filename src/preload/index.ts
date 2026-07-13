// ============================================================
// PRELOAD SCRIPT
// ============================================================

import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS } from '../shared/types/ipc'

// Custom APIs for renderer
const api = {
  // Auth
  login: (credentials: any) => ipcRenderer.invoke(IPC_CHANNELS.AUTH_LOGIN, credentials),
  logout: (token: string) => ipcRenderer.invoke(IPC_CHANNELS.AUTH_LOGOUT, { token }),
  getSession: (token: string) => ipcRenderer.invoke(IPC_CHANNELS.AUTH_GET_SESSION, { token }),
  changePassword: (data: any) => ipcRenderer.invoke(IPC_CHANNELS.AUTH_CHANGE_PASSWORD, data),

  // Clients
  getClients: (params?: any) => ipcRenderer.invoke(IPC_CHANNELS.CLIENTS_LIST, params),
  getClient: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.CLIENTS_GET, id),
  createClient: (data: any, session?: any) => ipcRenderer.invoke(IPC_CHANNELS.CLIENTS_CREATE, data, session),
  updateClient: (id: number, data: any, session?: any) => ipcRenderer.invoke(IPC_CHANNELS.CLIENTS_UPDATE, id, data, session),
  deleteClient: (id: number, session?: any) => ipcRenderer.invoke(IPC_CHANNELS.CLIENTS_DELETE, id, session),
  searchClients: (query: string) => ipcRenderer.invoke(IPC_CHANNELS.CLIENTS_SEARCH, query),

  // Contracts
  getContracts: (params?: any) => ipcRenderer.invoke(IPC_CHANNELS.CONTRACTS_LIST, params),
  getContract: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.CONTRACTS_GET, id),
  generateContractNumber: () => ipcRenderer.invoke(IPC_CHANNELS.CONTRACTS_GENERATE_NUMBER),
  createContract: (data: any, session?: any) => ipcRenderer.invoke(IPC_CHANNELS.CONTRACTS_CREATE, data, session),
  updateContract: (id: number, data: any, session?: any) => ipcRenderer.invoke(IPC_CHANNELS.CONTRACTS_UPDATE, id, data, session),
  transitionContract: (id: number, status: string, session?: any) => ipcRenderer.invoke(IPC_CHANNELS.CONTRACTS_TRANSITION, id, status, session),
  deleteContract: (id: number, session?: any) => ipcRenderer.invoke(IPC_CHANNELS.CONTRACTS_DELETE, id, session),
  generateContractPdf: (id: number, session?: any) => ipcRenderer.invoke(IPC_CHANNELS.CONTRACTS_GENERATE_PDF, id, session),
  searchContracts: (query: string) => ipcRenderer.invoke(IPC_CHANNELS.CONTRACTS_SEARCH, query),

  // Documents
  getDocuments: (params?: any) => ipcRenderer.invoke(IPC_CHANNELS.DOCUMENTS_LIST, params),
  getDocument: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.DOCUMENTS_GET, id),
  uploadDocument: (data: any, fileBuffer: ArrayBuffer, session?: any) => ipcRenderer.invoke(IPC_CHANNELS.DOCUMENTS_UPLOAD, data, fileBuffer, session),
  deleteDocument: (id: number, session?: any) => ipcRenderer.invoke(IPC_CHANNELS.DOCUMENTS_DELETE, id, session),
  getDocumentVersions: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.DOCUMENTS_GET_VERSIONS, id),
  restoreDocumentVersion: (id: number, session?: any) => ipcRenderer.invoke(IPC_CHANNELS.DOCUMENTS_RESTORE_VERSION, id, session),
  openDocument: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.DOCUMENTS_OPEN, id),
  runOCR: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.DOCUMENTS_RUN_OCR, id),

  // Appointments
  getAppointments: (params?: any) => ipcRenderer.invoke(IPC_CHANNELS.APPOINTMENTS_LIST, params),
  getAppointment: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.APPOINTMENTS_GET, id),
  createAppointment: (data: any, session?: any) => ipcRenderer.invoke(IPC_CHANNELS.APPOINTMENTS_CREATE, data, session),
  updateAppointment: (id: number, data: any, session?: any) => ipcRenderer.invoke(IPC_CHANNELS.APPOINTMENTS_UPDATE, id, data, session),
  deleteAppointment: (id: number, session?: any) => ipcRenderer.invoke(IPC_CHANNELS.APPOINTMENTS_DELETE, id, session),
  getCalendar: (start: string, end: string) => ipcRenderer.invoke(IPC_CHANNELS.APPOINTMENTS_CALENDAR, start, end),

  // Users
  getUsers: () => ipcRenderer.invoke(IPC_CHANNELS.USERS_LIST),
  getUser: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.USERS_GET, id),
  createUser: (data: any, session?: any) => ipcRenderer.invoke(IPC_CHANNELS.USERS_CREATE, data, session),
  updateUser: (id: number, data: any, session?: any) => ipcRenderer.invoke(IPC_CHANNELS.USERS_UPDATE, id, data, session),
  deleteUser: (id: number, session?: any) => ipcRenderer.invoke(IPC_CHANNELS.USERS_DELETE, id, session),
  resetPassword: (id: number, newPassword: string, session?: any) => ipcRenderer.invoke(IPC_CHANNELS.USERS_RESET_PASSWORD, id, newPassword, session),

  // Audit
  getAuditLogs: (params?: any) => ipcRenderer.invoke(IPC_CHANNELS.AUDIT_LIST, params),
  exportAuditLogs: (format: string, session?: any) => ipcRenderer.invoke(IPC_CHANNELS.AUDIT_EXPORT, format, session),

  // Notifications
  getNotifications: (userId: number) => ipcRenderer.invoke(IPC_CHANNELS.NOTIFICATIONS_GET_ALL, userId),
  getUnreadCount: (userId: number) => ipcRenderer.invoke(IPC_CHANNELS.NOTIFICATIONS_GET_UNREAD_COUNT, userId),
  markNotificationRead: (id: number, userId: number) => ipcRenderer.invoke(IPC_CHANNELS.NOTIFICATIONS_MARK_READ, id, userId),
  markAllRead: (userId: number) => ipcRenderer.invoke(IPC_CHANNELS.NOTIFICATIONS_MARK_ALL_READ, userId),
  deleteNotification: (id: number, userId: number) => ipcRenderer.invoke(IPC_CHANNELS.NOTIFICATIONS_DELETE, id, userId),

  // Settings
  getSettings: () => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET_ALL),
  getSetting: (key: string) => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET, key),
  updateSettings: (settings: any, session?: any) => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_UPDATE, settings, session),

  // Backup
  getBackups: () => ipcRenderer.invoke(IPC_CHANNELS.BACKUP_LIST),
  createBackup: (session?: any) => ipcRenderer.invoke(IPC_CHANNELS.BACKUP_CREATE, session),
  restoreBackup: (path: string, session?: any) => ipcRenderer.invoke(IPC_CHANNELS.BACKUP_RESTORE, path, session),
  deleteBackup: (name: string, session?: any) => ipcRenderer.invoke(IPC_CHANNELS.BACKUP_DELETE, name, session),

  // Templates
  getTemplates: () => ipcRenderer.invoke(IPC_CHANNELS.TEMPLATES_LIST),
  getTemplate: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.TEMPLATES_GET, id),
  getTemplateByType: (type: string) => ipcRenderer.invoke(IPC_CHANNELS.TEMPLATES_GET_BY_TYPE, type),
  updateTemplate: (id: number, data: any, session?: any) => ipcRenderer.invoke(IPC_CHANNELS.TEMPLATES_UPDATE, id, data, session),

  // Dashboard & Search
  getDashboardStats: () => ipcRenderer.invoke(IPC_CHANNELS.DASHBOARD_STATS),
  getRecentActivity: () => ipcRenderer.invoke(IPC_CHANNELS.DASHBOARD_RECENT_ACTIVITY),
  getDashboardCharts: () => ipcRenderer.invoke(IPC_CHANNELS.DASHBOARD_CHARTS),
  globalSearch: (query: string, session?: any) => ipcRenderer.invoke(IPC_CHANNELS.SEARCH_GLOBAL, query, session),

  // Dialogs
  openFileDialog: (options?: any) => ipcRenderer.invoke(IPC_CHANNELS.DIALOG_OPEN_FILE, options),
  showError: (title: string, content: string) => ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_SHOW_ERROR, title, content),
  showMessage: (options: any) => ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_SHOW_MESSAGE, options),
  saveFile: (defaultPath: string) => ipcRenderer.invoke(IPC_CHANNELS.DIALOG_SAVE_FILE, defaultPath),
  copyFileTo: (source: string, dest: string) => ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_COPY_FILE_TO, source, dest),

  // Platform
  platform: process.platform
}

// Expose API to renderer
try {
  contextBridge.exposeInMainWorld('api', api)
} catch (error) {
  console.error(error)
}

// Ensure TypeScript recognizes this is a module
export {}
