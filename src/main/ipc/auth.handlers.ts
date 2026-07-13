// ============================================================
// AUTH IPC HANDLERS
// ============================================================

import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '@shared/types/ipc'
import { login, logout, getSession, changePassword } from '../services/auth.service'

export function registerAuthHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.AUTH_LOGIN, async (_, { username, password }) => {
    try {
      return await login(username, password)
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC_CHANNELS.AUTH_LOGOUT, async (_, { token }) => {
    try {
      return logout(token)
    } catch (error: any) {
      return false
    }
  })

  ipcMain.handle(IPC_CHANNELS.AUTH_GET_SESSION, async (_, { token }) => {
    try {
      return getSession(token)
    } catch (error: any) {
      return null
    }
  })

  ipcMain.handle(IPC_CHANNELS.AUTH_CHANGE_PASSWORD, async (_, { token, newPassword }) => {
    try {
      return await changePassword(token, newPassword)
    } catch (error: any) {
      return false
    }
  })
}
