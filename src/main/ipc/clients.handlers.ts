// ============================================================
// CLIENTS IPC HANDLERS
// ============================================================

import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '@shared/types/ipc'
import { 
  findAllClients, 
  findClientById, 
  createClient, 
  updateClient, 
  softDeleteClient, 
  searchClients 
} from '../database/repositories/clients'
import { logAction } from '../database/repositories/audit'
import { AuditActionType, AuditEntityType } from '@shared/types/enums'

export function registerClientsHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.CLIENTS_LIST, async (_, params) => {
    return findAllClients(params)
  })

  ipcMain.handle(IPC_CHANNELS.CLIENTS_GET, async (_, id: number) => {
    return findClientById(id)
  })

  ipcMain.handle(IPC_CHANNELS.CLIENTS_CREATE, async (_, data, sessionData) => {
    const client = createClient({ ...data, created_by: sessionData?.user?.id })
    
    if (sessionData?.user) {
      logAction({
        user_id: sessionData.user.id,
        username: sessionData.user.username,
        action_type: AuditActionType.CREATE,
        entity_type: AuditEntityType.CLIENT,
        entity_id: client.id,
        description: `Created client: ${client.full_name}`,
        session_id: sessionData.token
      })
    }
    
    return client
  })

  ipcMain.handle(IPC_CHANNELS.CLIENTS_UPDATE, async (_, id: number, data, sessionData) => {
    const client = updateClient(id, data)
    
    if (sessionData?.user) {
      logAction({
        user_id: sessionData.user.id,
        username: sessionData.user.username,
        action_type: AuditActionType.UPDATE,
        entity_type: AuditEntityType.CLIENT,
        entity_id: client.id,
        description: `Updated client: ${client.full_name}`,
        session_id: sessionData.token
      })
    }
    
    return client
  })

  ipcMain.handle(IPC_CHANNELS.CLIENTS_DELETE, async (_, id: number, sessionData) => {
    const client = findClientById(id)
    if (!client) return false
    
    softDeleteClient(id)
    
    if (sessionData?.user) {
      logAction({
        user_id: sessionData.user.id,
        username: sessionData.user.username,
        action_type: AuditActionType.DELETE,
        entity_type: AuditEntityType.CLIENT,
        entity_id: id,
        description: `Deleted client: ${client.full_name}`,
        session_id: sessionData.token
      })
    }
    
    return true
  })

  ipcMain.handle(IPC_CHANNELS.CLIENTS_SEARCH, async (_, query: string) => {
    return searchClients(query)
  })
}
