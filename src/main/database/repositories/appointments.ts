// ============================================================
// APPOINTMENTS REPOSITORY — CRUD + calendar queries
// ============================================================

import { getDatabase } from '../connection'
import type { IAppointment, IAppointmentWithClient, PaginatedResult, PaginationParams } from '@shared/types/entities'

export function findAllAppointments(params: PaginationParams): PaginatedResult<IAppointmentWithClient> {
  const db = getDatabase()
  const { limit, afterId, search, sortBy, sortDir, filters } = params

  const conditions: string[] = []
  const queryParams: (string | number)[] = []

  if (afterId) {
    conditions.push('a.id > ?')
    queryParams.push(afterId)
  }

  if (search) {
    conditions.push('(a.title LIKE ? OR a.title_ar LIKE ? OR cl.full_name LIKE ?)')
    const like = `%${search}%`
    queryParams.push(like, like, like)
  }

  if (filters) {
    if (filters.status) { conditions.push('a.status = ?'); queryParams.push(filters.status as string) }
    if (filters.client_id) { conditions.push('a.client_id = ?'); queryParams.push(filters.client_id as number) }
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const countRow = db.prepare(`
    SELECT COUNT(*) as total FROM appointments a
    LEFT JOIN clients cl ON a.client_id = cl.id
    ${whereClause}
  `).get(...queryParams) as { total: number }

  const orderCol = sortBy ? `a.${sortBy}` : 'a.appointment_date'
  const orderDir = sortDir || 'desc'

  const rows = db.prepare(`
    SELECT a.*, cl.full_name as client_name, ct.contract_number
    FROM appointments a
    LEFT JOIN clients cl ON a.client_id = cl.id
    LEFT JOIN contracts ct ON a.contract_id = ct.id
    ${whereClause}
    ORDER BY ${orderCol} ${orderDir}
    LIMIT ?
  `).all(...queryParams, limit + 1) as IAppointmentWithClient[]

  const hasMore = rows.length > limit
  if (hasMore) rows.pop()

  return {
    data: rows,
    total: countRow.total,
    hasMore,
    lastId: rows.length > 0 ? rows[rows.length - 1].id : null
  }
}

export function findAppointmentById(id: number): IAppointmentWithClient | null {
  const db = getDatabase()
  return (db.prepare(`
    SELECT a.*, cl.full_name as client_name, ct.contract_number
    FROM appointments a
    LEFT JOIN clients cl ON a.client_id = cl.id
    LEFT JOIN contracts ct ON a.contract_id = ct.id
    WHERE a.id = ?
  `).get(id) as IAppointmentWithClient) || null
}

export function createAppointment(data: {
  client_id?: number | null
  contract_id?: number | null
  title: string
  title_ar?: string | null
  appointment_date: string
  start_time: string
  end_time?: string | null
  duration_minutes?: number
  location?: string | null
  notes?: string | null
  created_by?: number | null
}): IAppointmentWithClient {
  const db = getDatabase()
  const result = db.prepare(`
    INSERT INTO appointments (client_id, contract_id, title, title_ar, appointment_date, start_time, end_time, duration_minutes, location, notes, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.client_id || null,
    data.contract_id || null,
    data.title,
    data.title_ar || null,
    data.appointment_date,
    data.start_time,
    data.end_time || null,
    data.duration_minutes || 30,
    data.location || null,
    data.notes || null,
    data.created_by || null
  )

  return findAppointmentById(result.lastInsertRowid as number)!
}

export function updateAppointment(id: number, data: Partial<IAppointment>): IAppointmentWithClient {
  const db = getDatabase()
  const fields: string[] = []
  const values: (string | number | null)[] = []

  const allowedFields = [
    'client_id', 'contract_id', 'title', 'title_ar', 'appointment_date',
    'start_time', 'end_time', 'duration_minutes', 'status', 'location',
    'notes', 'reminder_sent'
  ]

  for (const field of allowedFields) {
    if (field in data) {
      fields.push(`${field} = ?`)
      values.push((data as Record<string, unknown>)[field] as string | number | null)
    }
  }

  if (fields.length === 0) return findAppointmentById(id)!

  fields.push("updated_at = datetime('now')")
  values.push(id)

  db.prepare(`UPDATE appointments SET ${fields.join(', ')} WHERE id = ?`).run(...values)
  return findAppointmentById(id)!
}

export function deleteAppointment(id: number): void {
  const db = getDatabase()
  db.prepare('DELETE FROM appointments WHERE id = ?').run(id)
}

export function findAppointmentsByDateRange(startDate: string, endDate: string): IAppointmentWithClient[] {
  const db = getDatabase()
  return db.prepare(`
    SELECT a.*, cl.full_name as client_name, ct.contract_number
    FROM appointments a
    LEFT JOIN clients cl ON a.client_id = cl.id
    LEFT JOIN contracts ct ON a.contract_id = ct.id
    WHERE a.appointment_date BETWEEN ? AND ?
    ORDER BY a.appointment_date ASC, a.start_time ASC
  `).all(startDate, endDate) as IAppointmentWithClient[]
}

export function findAppointmentsByClient(clientId: number): IAppointmentWithClient[] {
  const db = getDatabase()
  return db.prepare(`
    SELECT a.*, cl.full_name as client_name, ct.contract_number
    FROM appointments a
    LEFT JOIN clients cl ON a.client_id = cl.id
    LEFT JOIN contracts ct ON a.contract_id = ct.id
    WHERE a.client_id = ?
    ORDER BY a.appointment_date DESC
  `).all(clientId) as IAppointmentWithClient[]
}

export function countUpcomingAppointments(): number {
  const db = getDatabase()
  const row = db.prepare(
    "SELECT COUNT(*) as count FROM appointments WHERE appointment_date >= date('now') AND status IN ('scheduled', 'confirmed')"
  ).get() as { count: number }
  return row.count
}
