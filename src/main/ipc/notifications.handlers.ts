// ============================================================
// NOTIFICATIONS IPC HANDLERS
// ============================================================

import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '@shared/types/ipc'
import {
  getUserNotifications,
  countUnreadNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
} from '../database/repositories/notifications'

export function registerNotificationsHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.NOTIFICATIONS_GET_ALL, async (_, userId: number) => {
    return getUserNotifications(userId)
  })

  ipcMain.handle(IPC_CHANNELS.NOTIFICATIONS_GET_UNREAD_COUNT, async (_, userId: number) => {
    return countUnreadNotifications(userId)
  })

  ipcMain.handle(IPC_CHANNELS.NOTIFICATIONS_MARK_READ, async (_, id: number, userId: number) => {
    markAsRead(id, userId)
    return true
  })

  ipcMain.handle(IPC_CHANNELS.NOTIFICATIONS_MARK_ALL_READ, async (_, userId: number) => {
    markAllAsRead(userId)
    return true
  })

  ipcMain.handle(IPC_CHANNELS.NOTIFICATIONS_DELETE, async (_, id: number, userId: number) => {
    deleteNotification(id, userId)
    return true
  })
}
