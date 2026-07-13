// ============================================================
// CLIENTS REPOSITORY — CRUD + search for clients
// ============================================================

import { getDatabase } from '../connection'
import type { IClient, PaginatedResult, PaginationParams } from '@shared/types/entities'

export function findAllClients(params: PaginationParams): PaginatedResult<IClient> {
  const db = getDatabase()
  const { limit, afterId, search, sortBy, sortDir, filters } = params

  const conditions: string[] = ['c.is_deleted = 0']
  const queryParams: (string | number)[] = []

  if (afterId) {
    conditions.push('c.id > ?')
    queryParams.push(afterId)
  }

  if (search) {
    conditions.push('(c.full_name LIKE ? OR c.full_name_ar LIKE ? OR c.national_id LIKE ? OR c.phone LIKE ?)')
    const like = `%${search}%`
    queryParams.push(like, like, like, like)
  }

  if (filters) {
    if (filters.status) {
      conditions.push('c.status = ?')
      queryParams.push(filters.status as string)
    }
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const countRow = db.prepare(
    `SELECT COUNT(*) as total FROM clients c ${whereClause}`
  ).get(...queryParams) as { total: number }

  const orderCol = sortBy || 'id'
  const orderDir = sortDir || 'desc'
  const orderClause = `ORDER BY c.${orderCol} ${orderDir}`

  const rows = db.prepare(
    `SELECT c.* FROM clients c ${whereClause} ${orderClause} LIMIT ?`
  ).all(...queryParams, limit + 1) as IClient[]

  const hasMore = rows.length > limit
  if (hasMore) rows.pop()

  return {
    data: rows,
    total: countRow.total,
    hasMore,
    lastId: rows.length > 0 ? rows[rows.length - 1].id : null
  }
}

export function findClientById(id: number): IClient | null {
  const db = getDatabase()
  return (db.prepare('SELECT * FROM clients WHERE id = ? AND is_deleted = 0').get(id) as IClient) || null
}

export function createClient(data: {
  full_name: string
  full_name_ar?: string | null
  national_id: string
  phone?: string | null
  address?: string | null
  address_ar?: string | null
  notes?: string | null
  created_by?: number | null
}): IClient {
  const db = getDatabase()
  const result = db.prepare(`
    INSERT INTO clients (full_name, full_name_ar, national_id, phone, address, address_ar, notes, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.full_name,
    data.full_name_ar || null,
    data.national_id,
    data.phone || null,
    data.address || null,
    data.address_ar || null,
    data.notes || null,
    data.created_by || null
  )

  return findClientById(result.lastInsertRowid as number)!
}

export function updateClient(id: number, data: Partial<IClient>): IClient {
  const db = getDatabase()
  const fields: string[] = []
  const values: (string | number | null)[] = []

  const allowedFields = ['full_name', 'full_name_ar', 'national_id', 'phone', 'address', 'address_ar', 'notes', 'status']
  for (const field of allowedFields) {
    if (field in data) {
      fields.push(`${field} = ?`)
      values.push((data as Record<string, unknown>)[field] as string | number | null)
    }
  }

  if (fields.length === 0) return findClientById(id)!

  fields.push("updated_at = datetime('now')")
  values.push(id)

  db.prepare(`UPDATE clients SET ${fields.join(', ')} WHERE id = ?`).run(...values)
  return findClientById(id)!
}

export function softDeleteClient(id: number): void {
  const db = getDatabase()
  db.prepare("UPDATE clients SET is_deleted = 1, updated_at = datetime('now') WHERE id = ?").run(id)
}

export function searchClients(query: string): IClient[] {
  const db = getDatabase()

  // Try FTS first, fall back to LIKE
  try {
    const ftsQuery = query.split(/\s+/).map(t => `"${t}"*`).join(' ')
    return db.prepare(`
      SELECT c.* FROM clients c
      JOIN clients_fts ON clients_fts.rowid = c.id
      WHERE clients_fts MATCH ? AND c.is_deleted = 0
      ORDER BY rank
      LIMIT 50
    `).all(ftsQuery) as IClient[]
  } catch {
    const like = `%${query}%`
    return db.prepare(`
      SELECT * FROM clients
      WHERE is_deleted = 0 AND (full_name LIKE ? OR full_name_ar LIKE ? OR national_id LIKE ?)
      LIMIT 50
    `).all(like, like, like) as IClient[]
  }
}

export function getClientContractCount(clientId: number): number {
  const db = getDatabase()
  const row = db.prepare(
    'SELECT COUNT(*) as count FROM contracts WHERE (client_a_id = ? OR client_b_id = ?) AND is_deleted = 0'
  ).get(clientId, clientId) as { count: number }
  return row.count
}

export function countClients(): number {
  const db = getDatabase()
  const row = db.prepare('SELECT COUNT(*) as count FROM clients WHERE is_deleted = 0').get() as { count: number }
  return row.count
}
