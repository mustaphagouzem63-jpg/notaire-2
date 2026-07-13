// ============================================================
// CONTRACTS REPOSITORY — CRUD, status transitions, numbering
// ============================================================

import { getDatabase } from '../connection'
import type { IContract, IContractWithClients, PaginatedResult, PaginationParams } from '@shared/types/entities'
import type { ContractStatus } from '@shared/types/enums'

export function findAllContracts(params: PaginationParams): PaginatedResult<IContractWithClients> {
  const db = getDatabase()
  const { limit, afterId, search, sortBy, sortDir, filters } = params

  const conditions: string[] = ['c.is_deleted = 0']
  const queryParams: (string | number)[] = []

  if (afterId) {
    conditions.push('c.id > ?')
    queryParams.push(afterId)
  }

  if (search) {
    conditions.push('(c.contract_number LIKE ? OR ca.full_name LIKE ? OR cb.full_name LIKE ?)')
    const like = `%${search}%`
    queryParams.push(like, like, like)
  }

  if (filters) {
    if (filters.status) { conditions.push('c.status = ?'); queryParams.push(filters.status as string) }
    if (filters.contract_type) { conditions.push('c.contract_type = ?'); queryParams.push(filters.contract_type as string) }
    if (filters.client_id) {
      conditions.push('(c.client_a_id = ? OR c.client_b_id = ?)')
      queryParams.push(filters.client_id as number, filters.client_id as number)
    }
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`

  const countRow = db.prepare(`
    SELECT COUNT(*) as total FROM contracts c
    LEFT JOIN clients ca ON c.client_a_id = ca.id
    LEFT JOIN clients cb ON c.client_b_id = cb.id
    ${whereClause}
  `).get(...queryParams) as { total: number }

  const orderCol = sortBy ? `c.${sortBy}` : 'c.id'
  const orderDir = sortDir || 'desc'

  const rows = db.prepare(`
    SELECT c.*, ca.full_name as client_a_name, cb.full_name as client_b_name
    FROM contracts c
    LEFT JOIN clients ca ON c.client_a_id = ca.id
    LEFT JOIN clients cb ON c.client_b_id = cb.id
    ${whereClause}
    ORDER BY ${orderCol} ${orderDir}
    LIMIT ?
  `).all(...queryParams, limit + 1) as IContractWithClients[]

  const hasMore = rows.length > limit
  if (hasMore) rows.pop()

  return {
    data: rows,
    total: countRow.total,
    hasMore,
    lastId: rows.length > 0 ? rows[rows.length - 1].id : null
  }
}

export function findContractById(id: number): IContractWithClients | null {
  const db = getDatabase()
  return (db.prepare(`
    SELECT c.*, ca.full_name as client_a_name, cb.full_name as client_b_name
    FROM contracts c
    LEFT JOIN clients ca ON c.client_a_id = ca.id
    LEFT JOIN clients cb ON c.client_b_id = cb.id
    WHERE c.id = ? AND c.is_deleted = 0
  `).get(id) as IContractWithClients) || null
}

export function createContract(data: {
  contract_number: string
  contract_type: string
  client_a_id: number
  client_b_id?: number | null
  content_ar?: string | null
  content_fr?: string | null
  property_details?: string | null
  notary_fees?: number
  government_tax?: number
  stamp_duty?: number
  created_by?: number | null
}): IContractWithClients {
  const db = getDatabase()
  const result = db.prepare(`
    INSERT INTO contracts (contract_number, contract_type, client_a_id, client_b_id, content_ar, content_fr, property_details, notary_fees, government_tax, stamp_duty, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.contract_number,
    data.contract_type,
    data.client_a_id,
    data.client_b_id || null,
    data.content_ar || null,
    data.content_fr || null,
    data.property_details || null,
    data.notary_fees || 0,
    data.government_tax || 0,
    data.stamp_duty || 0,
    data.created_by || null
  )

  return findContractById(result.lastInsertRowid as number)!
}

export function updateContract(id: number, data: Partial<IContract>): IContractWithClients {
  const db = getDatabase()
  const fields: string[] = []
  const values: (string | number | null)[] = []

  const allowedFields = [
    'contract_type', 'client_a_id', 'client_b_id', 'content_ar', 'content_fr',
    'property_details', 'pdf_path', 'status', 'signed_date', 'notary_fees',
    'government_tax', 'stamp_duty', 'signature_image_path', 'stamp_image_path',
    'document_hash', 'approved_by', 'finalized_by'
  ]

  for (const field of allowedFields) {
    if (field in data) {
      fields.push(`${field} = ?`)
      values.push((data as Record<string, unknown>)[field] as string | number | null)
    }
  }

  if (fields.length === 0) return findContractById(id)!

  fields.push("updated_at = datetime('now')")
  values.push(id)

  db.prepare(`UPDATE contracts SET ${fields.join(', ')} WHERE id = ?`).run(...values)
  return findContractById(id)!
}

export function transitionContract(id: number, newStatus: ContractStatus, userId: number): IContractWithClients {
  const db = getDatabase()
  const updates: Record<string, unknown> = { status: newStatus }

  if (newStatus === 'approved') {
    updates.approved_by = userId
  } else if (newStatus === 'finalized') {
    updates.finalized_by = userId
    updates.signed_date = new Date().toISOString().split('T')[0]
  }

  return updateContract(id, updates as Partial<IContract>)
}

export function softDeleteContract(id: number): void {
  const db = getDatabase()
  db.prepare("UPDATE contracts SET is_deleted = 1, updated_at = datetime('now') WHERE id = ?").run(id)
}

export function generateContractNumber(): string {
  const db = getDatabase()
  const year = new Date().getFullYear()
  const prefix = `NOT-${year}-`

  const row = db.prepare(`
    SELECT contract_number FROM contracts
    WHERE contract_number LIKE ?
    ORDER BY contract_number DESC LIMIT 1
  `).get(`${prefix}%`) as { contract_number: string } | undefined

  let seq = 1
  if (row) {
    const lastSeq = parseInt(row.contract_number.replace(prefix, ''), 10)
    if (!isNaN(lastSeq)) seq = lastSeq + 1
  }

  return `${prefix}${String(seq).padStart(5, '0')}`
}

export function findContractsByClient(clientId: number): IContractWithClients[] {
  const db = getDatabase()
  return db.prepare(`
    SELECT c.*, ca.full_name as client_a_name, cb.full_name as client_b_name
    FROM contracts c
    LEFT JOIN clients ca ON c.client_a_id = ca.id
    LEFT JOIN clients cb ON c.client_b_id = cb.id
    WHERE (c.client_a_id = ? OR c.client_b_id = ?) AND c.is_deleted = 0
    ORDER BY c.created_at DESC
  `).all(clientId, clientId) as IContractWithClients[]
}

export function countContracts(filters?: Record<string, string | number>): number {
  const db = getDatabase()
  const conditions = ['is_deleted = 0']
  const params: (string | number)[] = []

  if (filters) {
    if (filters.status) { conditions.push('status = ?'); params.push(filters.status) }
    if (filters.contract_type) { conditions.push('contract_type = ?'); params.push(filters.contract_type) }
  }

  const row = db.prepare(
    `SELECT COUNT(*) as count FROM contracts WHERE ${conditions.join(' AND ')}`
  ).get(...params) as { count: number }
  return row.count
}

export function countContractsToday(): number {
  const db = getDatabase()
  const row = db.prepare(
    "SELECT COUNT(*) as count FROM contracts WHERE date(created_at) = date('now') AND is_deleted = 0"
  ).get() as { count: number }
  return row.count
}

export function countContractsThisMonth(): number {
  const db = getDatabase()
  const row = db.prepare(
    "SELECT COUNT(*) as count FROM contracts WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now') AND is_deleted = 0"
  ).get() as { count: number }
  return row.count
}

export function getContractsByType(): { type: string; count: number }[] {
  const db = getDatabase()
  return db.prepare(
    "SELECT contract_type as type, COUNT(*) as count FROM contracts WHERE is_deleted = 0 GROUP BY contract_type"
  ).all() as { type: string; count: number }[]
}

export function getContractsByStatus(): { status: string; count: number }[] {
  const db = getDatabase()
  return db.prepare(
    "SELECT status, COUNT(*) as count FROM contracts WHERE is_deleted = 0 GROUP BY status"
  ).all() as { status: string; count: number }[]
}

export function getMonthlyTrend(): { month: string; count: number }[] {
  const db = getDatabase()
  return db.prepare(`
    SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count
    FROM contracts WHERE is_deleted = 0
    GROUP BY month ORDER BY month DESC LIMIT 12
  `).all() as { month: string; count: number }[]
}

export function searchContracts(query: string): IContractWithClients[] {
  const db = getDatabase()
  const like = `%${query}%`
  return db.prepare(`
    SELECT c.*, ca.full_name as client_a_name, cb.full_name as client_b_name
    FROM contracts c
    LEFT JOIN clients ca ON c.client_a_id = ca.id
    LEFT JOIN clients cb ON c.client_b_id = cb.id
    WHERE c.is_deleted = 0
      AND (c.contract_number LIKE ? OR ca.full_name LIKE ? OR cb.full_name LIKE ?)
    ORDER BY c.created_at DESC
    LIMIT 50
  `).all(like, like, like) as IContractWithClients[]
}

