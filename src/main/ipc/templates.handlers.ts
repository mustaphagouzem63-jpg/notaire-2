// ============================================================
// TEMPLATES IPC HANDLERS
// ============================================================

import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '@shared/types/ipc'
import { getActiveTemplates, getTemplateByType, getTemplateById, updateTemplate } from '../database/repositories/templates'
import { logAction } from '../database/repositories/audit'
import { AuditActionType, AuditEntityType } from '@shared/types/enums'
import type { ContractType } from '@shared/types/enums'

export function registerTemplatesHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.TEMPLATES_LIST, async () => {
    return getActiveTemplates()
  })

  ipcMain.handle(IPC_CHANNELS.TEMPLATES_GET, async (_, id: number) => {
    return getTemplateById(id)
  })

  ipcMain.handle(IPC_CHANNELS.TEMPLATES_GET_BY_TYPE, async (_, type: ContractType) => {
    return getTemplateByType(type)
  })

  ipcMain.handle(IPC_CHANNELS.TEMPLATES_UPDATE, async (_, id: number, data, sessionData) => {
    const template = updateTemplate(id, data)
    
    if (sessionData?.user) {
      logAction({
        user_id: sessionData.user.id,
        username: sessionData.user.username,
        action_type: AuditActionType.UPDATE,
        entity_type: AuditEntityType.SYSTEM,
        description: `Updated template: ${template.contract_type} to version ${template.version}`,
        session_id: sessionData.token
      })
    }
    
    return template
  })
}
