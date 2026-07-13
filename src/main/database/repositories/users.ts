// ============================================================
// USERS REPOSITORY — CRUD + password management
// ============================================================

import { getDatabase } from '../connection'
import type { IUser } from '@shared/types/entities'

interface IUserWithPassword extends IUser {
  password_hash: string
}

export function findAllUsers(): IUser[] {
  const db = getDatabase()
  return db.prepare(
    'SELECT id, username, full_name, role, theme_preference, language_preference, is_active, force_password_change, last_login_at, created_at, updated_at FROM users ORDER BY id ASC'
  ).all() as IUser[]
}

export function findUserById(id: number): IUser | null {
  const db = getDatabase()
  return (db.prepare(
    'SELECT id, username, full_name, role, theme_preference, language_preference, is_active, force_password_change, last_login_at, created_at, updated_at FROM users WHERE id = ?'
  ).get(id) as IUser) || null
}

export function findUserByUsername(username: string): IUserWithPassword | null {
  const db = getDatabase()
  return (db.prepare('SELECT * FROM users WHERE username = ?').get(username) as IUserWithPassword) || null
}

export function createUser(data: {
  username: string
  password_hash: string
  full_name: string
  role: string
  language_preference?: string
  theme_preference?: string
}): IUser {
  const db = getDatabase()
  const result = db.prepare(`
    INSERT INTO users (username, password_hash, full_name, role, language_preference, theme_preference)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    data.username,
    data.password_hash,
    data.full_name,
    data.role,
    data.language_preference || 'fr',
    data.theme_preference || 'dark'
  )

  return findUserById(result.lastInsertRowid as number)!
}

export function updateUser(id: number, data: Partial<IUser>): IUser {
  const db = getDatabase()
  const fields: string[] = []
  const values: (string | number | null)[] = []

  const allowedFields = ['full_name', 'role', 'theme_preference', 'language_preference', 'is_active', 'force_password_change']
  for (const field of allowedFields) {
    if (field in data) {
      fields.push(`${field} = ?`)
      let val = (data as Record<string, unknown>)[field]
      if (typeof val === 'boolean') val = val ? 1 : 0
      values.push(val as string | number | null)
    }
  }

  if (fields.length === 0) return findUserById(id)!

  fields.push("updated_at = datetime('now')")
  values.push(id)

  db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values)
  return findUserById(id)!
}

export function updatePassword(id: number, passwordHash: string): void {
  const db = getDatabase()
  db.prepare(
    "UPDATE users SET password_hash = ?, force_password_change = 0, updated_at = datetime('now') WHERE id = ?"
  ).run(passwordHash, id)
}

export function updateLastLogin(id: number): void {
  const db = getDatabase()
  db.prepare(
    "UPDATE users SET last_login_at = datetime('now'), updated_at = datetime('now') WHERE id = ?"
  ).run(id)
}

export function deleteUser(id: number): void {
  const db = getDatabase()
  // Don't allow deleting the last admin
  const adminCount = db.prepare(
    "SELECT COUNT(*) as count FROM users WHERE role = 'admin' AND is_active = 1"
  ).get() as { count: number }

  const user = findUserById(id)
  if (user?.role === 'admin' && adminCount.count <= 1) {
    throw new Error('Cannot delete the last admin user')
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(id)
}

export function countUsers(): number {
  const db = getDatabase()
  const row = db.prepare('SELECT COUNT(*) as count FROM users WHERE is_active = 1').get() as { count: number }
  return row.count
}
