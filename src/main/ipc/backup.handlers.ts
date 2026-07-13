// ============================================================
// BACKUP IPC HANDLERS
// ============================================================

import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '@shared/types/ipc'
import { listBackups, createBackup, restoreBackup, deleteBackup } from '../services/backup.service'
import { logAction } from '../database/repositories/audit'
import { AuditActionType, AuditEntityType } from '@shared/types/enums'

export function registerBackupHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.BACKUP_LIST, async () => {
    return listBackups()
  })

  ipcMain.handle(IPC_CHANNELS.BACKUP_CREATE, async (_, sessionData) => {
    try {
      const backup = await createBackup()
      
      if (sessionData?.user) {
        logAction({
          user_id: sessionData.user.id,
          username: sessionData.user.username,
          action_type: AuditActionType.EXPORT, // Using EXPORT for Backup
          entity_type: AuditEntityType.SYSTEM,
          description: `Created system backup: ${backup.fileName}`,
          session_id: sessionData.token
        })
      }
      
      return backup
    } catch (error) {
      console.error('Error creating backup via IPC:', error)
      throw error
    }
  })

  ipcMain.handle(IPC_CHANNELS.BACKUP_RESTORE, async (_, filePath: string, sessionData) => {
    try {
      const success = restoreBackup(filePath)
      
      if (success && sessionData?.user) {
        logAction({
          user_id: sessionData.user.id,
          username: sessionData.user.username,
          action_type: AuditActionType.RESTORE,
          entity_type: AuditEntityType.SYSTEM,
          description: `Restored system backup from: ${filePath}`,
          session_id: sessionData.token
        })
      }
      
      return success
    } catch (error) {
      console.error('Error restoring backup via IPC:', error)
      throw error
    }
  })

  ipcMain.handle(IPC_CHANNELS.BACKUP_DELETE, async (_, fileName: string, sessionData) => {
    try {
      const success = deleteBackup(fileName)
      
      if (success && sessionData?.user) {
        logAction({
          user_id: sessionData.user.id,
          username: sessionData.user.username,
          action_type: AuditActionType.DELETE,
          entity_type: AuditEntityType.SYSTEM,
          description: `Deleted system backup: ${fileName}`,
          session_id: sessionData.token
        })
      }
      
      return success
    } catch (error) {
      console.error('Error deleting backup via IPC:', error)
      return false
    }
  })
}
