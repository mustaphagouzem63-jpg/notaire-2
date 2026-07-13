// ============================================================
// USERS IPC HANDLERS
// ============================================================

import { ipcMain } from 'electron'
import bcrypt from 'bcryptjs'
import { IPC_CHANNELS } from '@shared/types/ipc'
import {
  findAllUsers,
  findUserById,
  createUser,
  updateUser,
  deleteUser,
  updatePassword
} from '../database/repositories/users'
import { logAction } from '../database/repositories/audit'
import { AuditActionType, AuditEntityType } from '@shared/types/enums'

export function registerUsersHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.USERS_LIST, async () => {
    return findAllUsers()
  })

  ipcMain.handle(IPC_CHANNELS.USERS_GET, async (_, id: number) => {
    return findUserById(id)
  })

  ipcMain.handle(IPC_CHANNELS.USERS_CREATE, async (_, data, sessionData) => {
    // Hash default password
    const password_hash = await bcrypt.hash(data.password, 10)
    
    const user = createUser({
      username: data.username,
      password_hash,
      full_name: data.full_name,
      role: data.role,
      language_preference: data.language_preference,
      theme_preference: data.theme_preference
    })
    
    if (sessionData?.user) {
      logAction({
        user_id: sessionData.user.id,
        username: sessionData.user.username,
        action_type: AuditActionType.CREATE,
        entity_type: AuditEntityType.USER,
        entity_id: user.id,
        description: `Created user: ${user.username}`,
        session_id: sessionData.token
      })
    }
    
    return user
  })

  ipcMain.handle(IPC_CHANNELS.USERS_UPDATE, async (_, id: number, data, sessionData) => {
    const user = updateUser(id, data)
    
    if (sessionData?.user) {
      logAction({
        user_id: sessionData.user.id,
        username: sessionData.user.username,
        action_type: AuditActionType.UPDATE,
        entity_type: AuditEntityType.USER,
        entity_id: user.id,
        description: `Updated user: ${user.username}`,
        session_id: sessionData.token
      })
    }
    
    return user
  })

  ipcMain.handle(IPC_CHANNELS.USERS_DELETE, async (_, id: number, sessionData) => {
    const user = findUserById(id)
    if (!user) return false
    
    deleteUser(id)
    
    if (sessionData?.user) {
      logAction({
        user_id: sessionData.user.id,
        username: sessionData.user.username,
        action_type: AuditActionType.DELETE,
        entity_type: AuditEntityType.USER,
        entity_id: id,
        description: `Deleted user: ${user.username}`,
        session_id: sessionData.token
      })
    }
    
    return true
  })

  ipcMain.handle(IPC_CHANNELS.USERS_RESET_PASSWORD, async (_, id: number, newPassword, sessionData) => {
    const user = findUserById(id)
    if (!user) return false

    const password_hash = await bcrypt.hash(newPassword, 10)
    updatePassword(id, password_hash)
    
    // Also force them to change it on next login if admin reset it
    updateUser(id, { force_password_change: 1 })
    
    if (sessionData?.user) {
      logAction({
        user_id: sessionData.user.id,
        username: sessionData.user.username,
        action_type: AuditActionType.UPDATE,
        entity_type: AuditEntityType.USER,
        entity_id: user.id,
        description: `Reset password for user: ${user.username}`,
        session_id: sessionData.token
      })
    }
    
    return true
  })
}
