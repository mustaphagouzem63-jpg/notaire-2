// ============================================================
// SEARCH IPC HANDLERS
// ============================================================

import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '@shared/types/ipc'
import { performGlobalSearch } from '../services/search.service'
import { logAction } from '../database/repositories/audit'
import { AuditActionType, AuditEntityType } from '@shared/types/enums'

export function registerSearchHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.SEARCH_GLOBAL, async (_, query: string, sessionData) => {
    const results = performGlobalSearch(query)
    
    // We optionally log search actions to track what users are looking for
    if (sessionData?.user && query.length >= 3) {
      // Don't log every keystroke, only significant searches
      // In a real app we might throttle this or only log on explicit "enter" press
      logAction({
        user_id: sessionData.user.id,
        username: sessionData.user.username,
        action_type: AuditActionType.UPDATE, // Repurposing UPDATE or use a custom SEARCH action if added to enum
        entity_type: AuditEntityType.SYSTEM,
        description: `Global search query: ${query}`,
        session_id: sessionData.token
      })
    }
    
    return results
  })
}
