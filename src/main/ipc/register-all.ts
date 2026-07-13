// ============================================================
// REGISTER ALL IPC HANDLERS
// ============================================================

import { registerAuthHandlers } from './auth.handlers'
import { registerClientsHandlers } from './clients.handlers'
import { registerContractsHandlers } from './contracts.handlers'
import { registerDocumentsHandlers } from './documents.handlers'
import { registerAppointmentsHandlers } from './appointments.handlers'
import { registerUsersHandlers } from './users.handlers'
import { registerAuditHandlers } from './audit.handlers'
import { registerNotificationsHandlers } from './notifications.handlers'
import { registerSettingsHandlers } from './settings.handlers'
import { registerBackupHandlers } from './backup.handlers'
import { registerTemplatesHandlers } from './templates.handlers'
import { registerDashboardHandlers } from './dashboard.handlers'
import { registerSearchHandlers } from './search.handlers'
import { registerDialogHandlers } from './dialog.handlers'

export function registerIpcHandlers(): void {
  registerAuthHandlers()
  registerClientsHandlers()
  registerContractsHandlers()
  registerDocumentsHandlers()
  registerAppointmentsHandlers()
  registerUsersHandlers()
  registerAuditHandlers()
  registerNotificationsHandlers()
  registerSettingsHandlers()
  registerBackupHandlers()
  registerTemplatesHandlers()
  registerDashboardHandlers()
  registerSearchHandlers()
  registerDialogHandlers()
  
  console.log('✅ All IPC Handlers Registered')
}
