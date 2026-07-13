// ============================================================
// DATABASE CONNECTION — Singleton better-sqlite3 manager
// ============================================================

import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'

let db: Database.Database | null = null

/**
 * Get or create the singleton database connection.
 * Configures WAL mode, foreign keys, and performance pragmas.
 */
export function getDatabase(): Database.Database {
  if (db) return db

  const userDataPath = app.getPath('userData')
  const dbDir = path.join(userDataPath, 'data')

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
  }

  const dbPath = path.join(dbDir, 'notary.db')

  db = new Database(dbPath)

  // Performance and reliability pragmas
  db.pragma('journal_mode = WAL')
  db.pragma('busy_timeout = 5000')
  db.pragma('synchronous = NORMAL')
  db.pragma('cache_size = -20000') // 20 MB
  db.pragma('foreign_keys = ON')
  db.pragma('temp_store = MEMORY')

  return db
}

/**
 * Close the database connection gracefully.
 * Called on app shutdown.
 */
export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
  }
}

/**
 * Get the absolute path to the database file.
 */
export function getDatabasePath(): string {
  const userDataPath = app.getPath('userData')
  return path.join(userDataPath, 'data', 'notary.db')
}
