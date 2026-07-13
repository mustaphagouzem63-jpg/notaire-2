// ============================================================
// AUDIT IPC HANDLERS
// ============================================================

import { ipcMain, app } from 'electron'
import path from 'path'
import fs from 'fs'
import { IPC_CHANNELS } from '@shared/types/ipc'
import { findAuditLogs, getAllAuditLogsForExport } from '../database/repositories/audit'
import { logAction } from '../database/repositories/audit'
import { AuditActionType, AuditEntityType } from '@shared/types/enums'

export function registerAuditHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.AUDIT_LIST, async (_, params) => {
    return findAuditLogs(params)
  })

  ipcMain.handle(IPC_CHANNELS.AUDIT_EXPORT, async (_, format: 'csv' | 'json', sessionData) => {
    try {
      const logs = getAllAuditLogsForExport()
      const exportDir = path.join(app.getPath('downloads'), 'notary_exports')
      
      if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true })
      }
      
      const fileName = `audit_export_${new Date().toISOString().replace(/[:.]/g, '-')}.${format}`
      const filePath = path.join(exportDir, fileName)
      
      if (format === 'json') {
        fs.writeFileSync(filePath, JSON.stringify(logs, null, 2))
      } else if (format === 'csv') {
        // Simple CSV export
        const headers = ['id', 'timestamp', 'user_id', 'username', 'action_type', 'entity_type', 'entity_id', 'description']
        const csvContent = [
          headers.join(','),
          ...logs.map(log => {
            return headers.map(header => {
              const val = (log as any)[header]
              // Escape quotes for CSV
              return `"${(val || '').toString().replace(/"/g, '""')}"`
            }).join(',')
          })
        ].join('\n')
        
        fs.writeFileSync(filePath, csvContent)
      }
      
      if (sessionData?.user) {
        logAction({
          user_id: sessionData.user.id,
          username: sessionData.user.username,
          action_type: AuditActionType.EXPORT,
          entity_type: AuditEntityType.SYSTEM,
          description: `Exported audit logs to ${format.toUpperCase()}`,
          session_id: sessionData.token
        })
      }
      
      return filePath
    } catch (error) {
      console.error('Error exporting audit logs:', error)
      throw error
    }
  })
}
