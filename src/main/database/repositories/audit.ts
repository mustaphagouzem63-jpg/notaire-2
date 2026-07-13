// ============================================================
// AUDIT REPOSITORY — Append-only audit logs
// ============================================================

import { getDatabase } from '../connection'
import type { IAuditLog, PaginatedResult, PaginationParams } from '@shared/types/entities'
import type { AuditActionType, AuditEntityType } from '@shared/types/enums'

export function logAction(data: {
  user_id?: number | null
  username: string
  action_type: AuditActionType
  entity_type: AuditEntityType
  entity_id?: number | null
  old_value?: string | null
  new_value?: string | null
  description?: string | null
  session_id?: string | null
}): void {
  const db = getDatabase()
  db.prepare(`
    INSERT INTO audit_logs (user_id, username, action_type, entity_type, entity_id, old_value, new_value, description, session_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.user_id || null,
    data.username,
    data.action_type,
    data.entity_type,
    data.entity_id || null,
    data.old_value || null,
    data.new_value || null,
    data.description || null,
    data.session_id || null
  )
}

export function findAuditLogs(params: PaginationParams): PaginatedResult<IAuditLog> {
  const db = getDatabase()
  const { limit, afterId, search, sortBy, sortDir, filters } = params

  const conditions: string[] = []
  const queryParams: (string | number)[] = []

  if (afterId) {
    conditions.push('id < ?') // Audit logs are typically ordered DESC by id
    queryParams.push(afterId)
  }

  if (search) {
    conditions.push('(username LIKE ? OR description LIKE ?)')
    const like = `%${search}%`
    queryParams.push(like, like)
  }

  if (filters) {
    if (filters.action_type) { conditions.push('action_type = ?'); queryParams.push(filters.action_type as string) }
    if (filters.entity_type) { conditions.push('entity_type = ?'); queryParams.push(filters.entity_type as string) }
    if (filters.user_id) { conditions.push('user_id = ?'); queryParams.push(filters.user_id as number) }
    if (filters.start_date && filters.end_date) {
      conditions.push('date(timestamp) BETWEEN ? AND ?')
      queryParams.push(filters.start_date as string, filters.end_date as string)
    }
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const countRow = db.prepare(
    `SELECT COUNT(*) as total FROM audit_logs ${whereClause}`
  ).get(...queryParams) as { total: number }

  const orderCol = sortBy || 'id'
  const orderDir = sortDir || 'desc'

  const rows = db.prepare(
    `SELECT * FROM audit_logs ${whereClause} ORDER BY ${orderCol} ${orderDir} LIMIT ?`
  ).all(...queryParams, limit + 1) as IAuditLog[]

  const hasMore = rows.length > limit
  if (hasMore) rows.pop()

  return {
    data: rows,
    total: countRow.total,
    hasMore,
    lastId: rows.length > 0 ? rows[rows.length - 1].id : null
  }
}

export function getRecentActivity(limit: number = 10): IAuditLog[] {
  const db = getDatabase()
  return db.prepare(
    'SELECT * FROM audit_logs ORDER BY id DESC LIMIT ?'
  ).all(limit) as IAuditLog[]
}

export function getAllAuditLogsForExport(): IAuditLog[] {
  const db = getDatabase()
  return db.prepare('SELECT * FROM audit_logs ORDER BY id DESC').all() as IAuditLog[]
}
