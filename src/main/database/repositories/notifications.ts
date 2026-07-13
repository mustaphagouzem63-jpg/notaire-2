// ============================================================
// NOTIFICATIONS REPOSITORY — User notifications
// ============================================================

import { getDatabase } from '../connection'
import type { INotification } from '@shared/types/entities'
import type { NotificationType } from '@shared/types/enums'

export function createNotification(data: {
  user_id: number
  type: NotificationType
  title: string
  message: string
  entity_type?: string | null
  entity_id?: number | null
}): INotification {
  const db = getDatabase()
  const result = db.prepare(`
    INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    data.user_id,
    data.type,
    data.title,
    data.message,
    data.entity_type || null,
    data.entity_id || null
  )
  
  return getNotificationById(result.lastInsertRowid as number)!
}

export function getNotificationById(id: number): INotification | null {
  const db = getDatabase()
  return (db.prepare('SELECT * FROM notifications WHERE id = ?').get(id) as INotification) || null
}

export function getUserNotifications(userId: number, limit: number = 50): INotification[] {
  const db = getDatabase()
  return db.prepare(`
    SELECT * FROM notifications 
    WHERE user_id = ? 
    ORDER BY created_at DESC 
    LIMIT ?
  `).all(userId, limit) as INotification[]
}

export function countUnreadNotifications(userId: number): number {
  const db = getDatabase()
  const row = db.prepare(
    'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0'
  ).get(userId) as { count: number }
  return row.count
}

export function markAsRead(id: number, userId: number): void {
  const db = getDatabase()
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(id, userId)
}

export function markAllAsRead(userId: number): void {
  const db = getDatabase()
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(userId)
}

export function deleteNotification(id: number, userId: number): void {
  const db = getDatabase()
  db.prepare('DELETE FROM notifications WHERE id = ? AND user_id = ?').run(id, userId)
}
