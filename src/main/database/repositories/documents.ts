// ============================================================
// DOCUMENTS REPOSITORY — File metadata CRUD + versioning
// ============================================================

import { getDatabase } from '../connection'
import type { IDocument, PaginatedResult, PaginationParams } from '@shared/types/entities'

export function findAllDocuments(params: PaginationParams & { clientId?: number; contractId?: number }): PaginatedResult<IDocument> {
  const db = getDatabase()
  const { limit, afterId, search, sortBy, sortDir, filters, clientId, contractId } = params

  const conditions: string[] = ['d.is_current = 1']
  const queryParams: (string | number)[] = []

  if (afterId) {
    conditions.push('d.id > ?')
    queryParams.push(afterId)
  }

  if (clientId) {
    conditions.push('d.client_id = ?')
    queryParams.push(clientId)
  }

  if (contractId) {
    conditions.push('d.contract_id = ?')
    queryParams.push(contractId)
  }

  if (search) {
    conditions.push('(d.file_name LIKE ? OR d.ocr_text LIKE ?)')
    const like = `%${search}%`
    queryParams.push(like, like)
  }

  if (filters) {
    if (filters.document_category) {
      conditions.push('d.document_category = ?')
      queryParams.push(filters.document_category as string)
    }
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`

  const countRow = db.prepare(
    `SELECT COUNT(*) as total FROM documents d ${whereClause}`
  ).get(...queryParams) as { total: number }

  const orderCol = sortBy ? `d.${sortBy}` : 'd.id'
  const orderDir = sortDir || 'desc'

  const rows = db.prepare(
    `SELECT d.* FROM documents d ${whereClause} ORDER BY ${orderCol} ${orderDir} LIMIT ?`
  ).all(...queryParams, limit + 1) as IDocument[]

  const hasMore = rows.length > limit
  if (hasMore) rows.pop()

  return {
    data: rows,
    total: countRow.total,
    hasMore,
    lastId: rows.length > 0 ? rows[rows.length - 1].id : null
  }
}

export function findDocumentById(id: number): IDocument | null {
  const db = getDatabase()
  return (db.prepare('SELECT * FROM documents WHERE id = ?').get(id) as IDocument) || null
}

export function createDocument(data: {
  client_id?: number | null
  contract_id?: number | null
  file_name: string
  file_path: string
  document_category?: string | null
  mime_type?: string | null
  file_size?: number | null
  uploaded_by?: number | null
}): IDocument {
  const db = getDatabase()
  const result = db.prepare(`
    INSERT INTO documents (client_id, contract_id, file_name, file_path, document_category, mime_type, file_size, uploaded_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.client_id || null,
    data.contract_id || null,
    data.file_name,
    data.file_path,
    data.document_category || null,
    data.mime_type || null,
    data.file_size || null,
    data.uploaded_by || null
  )

  return findDocumentById(result.lastInsertRowid as number)!
}

export function deleteDocument(id: number): void {
  const db = getDatabase()
  db.prepare('DELETE FROM documents WHERE id = ?').run(id)
}

export function getDocumentVersions(documentId: number): IDocument[] {
  const db = getDatabase()
  // Get the root document id
  const doc = findDocumentById(documentId)
  if (!doc) return []

  const rootId = doc.parent_document_id || doc.id

  return db.prepare(`
    SELECT * FROM documents
    WHERE id = ? OR parent_document_id = ?
    ORDER BY version DESC
  `).all(rootId, rootId) as IDocument[]
}

export function createDocumentVersion(parentId: number, data: {
  file_name: string
  file_path: string
  change_summary?: string | null
  uploaded_by?: number | null
  mime_type?: string | null
  file_size?: number | null
}): IDocument {
  const db = getDatabase()
  const parent = findDocumentById(parentId)
  if (!parent) throw new Error('Parent document not found')

  const rootId = parent.parent_document_id || parent.id

  // Mark all previous versions as not current
  db.prepare('UPDATE documents SET is_current = 0 WHERE id = ? OR parent_document_id = ?').run(rootId, rootId)

  // Get next version number
  const maxVersion = db.prepare(
    'SELECT MAX(version) as maxV FROM documents WHERE id = ? OR parent_document_id = ?'
  ).get(rootId, rootId) as { maxV: number }

  const result = db.prepare(`
    INSERT INTO documents (client_id, contract_id, file_name, file_path, document_category, mime_type, file_size, version, is_current, parent_document_id, change_summary, uploaded_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
  `).run(
    parent.client_id,
    parent.contract_id,
    data.file_name,
    data.file_path,
    parent.document_category,
    data.mime_type || parent.mime_type,
    data.file_size || null,
    (maxVersion.maxV || 1) + 1,
    rootId,
    data.change_summary || null,
    data.uploaded_by || null
  )

  return findDocumentById(result.lastInsertRowid as number)!
}

export function restoreDocumentVersion(versionId: number): IDocument {
  const db = getDatabase()
  const version = findDocumentById(versionId)
  if (!version) throw new Error('Document version not found')

  const rootId = version.parent_document_id || version.id

  // Mark all as not current
  db.prepare('UPDATE documents SET is_current = 0 WHERE id = ? OR parent_document_id = ?').run(rootId, rootId)

  // Mark the selected version as current
  db.prepare('UPDATE documents SET is_current = 1 WHERE id = ?').run(versionId)

  return findDocumentById(versionId)!
}

export function findDocumentsByClient(clientId: number): IDocument[] {
  const db = getDatabase()
  return db.prepare(
    'SELECT * FROM documents WHERE client_id = ? AND is_current = 1 ORDER BY uploaded_at DESC'
  ).all(clientId) as IDocument[]
}

export function findDocumentsByContract(contractId: number): IDocument[] {
  const db = getDatabase()
  return db.prepare(
    'SELECT * FROM documents WHERE contract_id = ? AND is_current = 1 ORDER BY uploaded_at DESC'
  ).all(contractId) as IDocument[]
}

export function countDocuments(): number {
  const db = getDatabase()
  const row = db.prepare('SELECT COUNT(*) as count FROM documents WHERE is_current = 1').get() as { count: number }
  return row.count
}
