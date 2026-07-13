// ============================================================
// SETTINGS REPOSITORY — Key/value store for office config
// ============================================================

import { getDatabase } from '../connection'
import type { IOfficeSetting } from '@shared/types/entities'

export function getSetting(key: string): string | null {
  const db = getDatabase()
  const row = db.prepare('SELECT value FROM office_settings WHERE key = ?').get(key) as { value: string } | undefined
  return row ? row.value : null
}

export function getAllSettings(): Record<string, string> {
  const db = getDatabase()
  const rows = db.prepare('SELECT key, value FROM office_settings').all() as { key: string, value: string }[]
  
  const settings: Record<string, string> = {}
  for (const row of rows) {
    settings[row.key] = row.value
  }
  
  return settings
}

export function updateSetting(key: string, value: string): void {
  const db = getDatabase()
  db.prepare(`
    INSERT INTO office_settings (key, value, updated_at) 
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `).run(key, value)
}

export function updateSettings(settings: Record<string, string>): void {
  const db = getDatabase()
  const stmt = db.prepare(`
    INSERT INTO office_settings (key, value, updated_at) 
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `)
  
  const transaction = db.transaction((sets: Record<string, string>) => {
    for (const [key, value] of Object.entries(sets)) {
      stmt.run(key, value)
    }
  })
  
  transaction(settings)
}
