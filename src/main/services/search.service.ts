// ============================================================
// SEARCH SERVICE — Cross-entity global search
// ============================================================

import { getDatabase } from '../database/connection'
import type { ISearchResult } from '@shared/types/entities'

export function performGlobalSearch(query: string, limit: number = 20): ISearchResult[] {
  if (!query || query.trim().length < 2) {
    return []
  }

  const db = getDatabase()
  const results: ISearchResult[] = []
  
  // Format query for FTS5 (prefix search on all terms)
  const terms = query.trim().split(/\s+/)
  const ftsQuery = terms.map(t => `"${t}"*`).join(' ')
  const likeQuery = `%${query.trim()}%`

  try {
    // 1. Search Clients (using FTS)
    const clients = db.prepare(`
      SELECT 
        c.id, 
        c.full_name, 
        c.national_id, 
        snippet(clients_fts, -1, '<b>', '</b>', '...', 10) as highlight,
        rank
      FROM clients c
      JOIN clients_fts fts ON fts.rowid = c.id
      WHERE fts MATCH ? AND c.is_deleted = 0
      ORDER BY rank
      LIMIT ?
    `).all(ftsQuery, limit) as any[]

    for (const c of clients) {
      results.push({
        type: 'client',
        id: c.id,
        title: c.full_name,
        subtitle: `ID: ${c.national_id}`,
        highlight: c.highlight || '',
        relevance: c.rank
      })
    }

    // 2. Search Contracts (using FTS)
    const contracts = db.prepare(`
      SELECT 
        c.id, 
        c.contract_number, 
        c.contract_type,
        snippet(contracts_fts, -1, '<b>', '</b>', '...', 10) as highlight,
        rank
      FROM contracts c
      JOIN contracts_fts fts ON fts.rowid = c.id
      WHERE fts MATCH ? AND c.is_deleted = 0
      ORDER BY rank
      LIMIT ?
    `).all(ftsQuery, limit) as any[]

    for (const c of contracts) {
      results.push({
        type: 'contract',
        id: c.id,
        title: c.contract_number,
        subtitle: `Type: ${c.contract_type}`,
        highlight: c.highlight || '',
        relevance: c.rank
      })
    }

    // 3. Search Documents (using LIKE, no FTS table created for documents in schema)
    const documents = db.prepare(`
      SELECT id, file_name, document_category
      FROM documents
      WHERE (file_name LIKE ? OR ocr_text LIKE ?) AND is_current = 1
      LIMIT ?
    `).all(likeQuery, likeQuery, limit) as any[]

    for (const d of documents) {
      results.push({
        type: 'document',
        id: d.id,
        title: d.file_name,
        subtitle: `Category: ${d.document_category || 'N/A'}`,
        highlight: '',
        relevance: -0.5 // Lower relevance for non-FTS results
      })
    }

    // 4. Search Appointments (using LIKE)
    const appointments = db.prepare(`
      SELECT id, title, appointment_date
      FROM appointments
      WHERE (title LIKE ? OR title_ar LIKE ?)
      LIMIT ?
    `).all(likeQuery, likeQuery, limit) as any[]

    for (const a of appointments) {
      results.push({
        type: 'appointment',
        id: a.id,
        title: a.title,
        subtitle: `Date: ${a.appointment_date}`,
        highlight: '',
        relevance: -0.5
      })
    }

  } catch (error) {
    console.error('Search error:', error)
  }

  // Sort by relevance (most negative FTS rank is best, then LIKE results)
  return results.sort((a, b) => a.relevance - b.relevance).slice(0, limit)
}
