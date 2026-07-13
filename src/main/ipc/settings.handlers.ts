// ============================================================
// SETTINGS IPC HANDLERS
// ============================================================

import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '@shared/types/ipc'
import { getAllSettings, getSetting, updateSetting, updateSettings } from '../database/repositories/settings'
import { logAction } from '../database/repositories/audit'
import { AuditActionType, AuditEntityType } from '@shared/types/enums'

export function registerSettingsHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET_ALL, async () => {
    return getAllSettings()
  })

  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, async (_, key: string) => {
    return getSetting(key)
  })

  ipcMain.handle(IPC_CHANNELS.SETTINGS_UPDATE, async (_, settings: Record<string, string>, sessionData) => {
    updateSettings(settings)
    
    if (sessionData?.user) {
      logAction({
        user_id: sessionData.user.id,
        username: sessionData.user.username,
        action_type: AuditActionType.UPDATE,
        entity_type: AuditEntityType.SYSTEM,
        description: `Updated system settings`,
        session_id: sessionData.token
      })
    }
    
    return true
  })
}
