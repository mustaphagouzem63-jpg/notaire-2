// ============================================================
// TEMPLATES REPOSITORY — Contract template management
// ============================================================

import { getDatabase } from '../connection'
import type { IContractTemplate } from '@shared/types/entities'
import type { ContractType } from '@shared/types/enums'

export function getActiveTemplates(): IContractTemplate[] {
  const db = getDatabase()
  return db.prepare(
    'SELECT * FROM contract_templates WHERE is_active = 1 ORDER BY contract_type ASC'
  ).all() as IContractTemplate[]
}

export function getTemplateByType(contractType: ContractType): IContractTemplate | null {
  const db = getDatabase()
  return (db.prepare(
    'SELECT * FROM contract_templates WHERE contract_type = ? AND is_active = 1 LIMIT 1'
  ).get(contractType) as IContractTemplate) || null
}

export function getTemplateById(id: number): IContractTemplate | null {
  const db = getDatabase()
  return (db.prepare('SELECT * FROM contract_templates WHERE id = ?').get(id) as IContractTemplate) || null
}

export function updateTemplate(id: number, data: {
  name_fr?: string
  name_ar?: string
  content_fr?: string
  content_ar?: string
}): IContractTemplate {
  const db = getDatabase()
  const template = getTemplateById(id)
  
  if (!template) {
    throw new Error('Template not found')
  }

  // Deactivate old version
  db.prepare('UPDATE contract_templates SET is_active = 0 WHERE id = ?').run(id)
  
  // Insert new version
  const result = db.prepare(`
    INSERT INTO contract_templates (contract_type, version, name_fr, name_ar, content_fr, content_ar, is_active, created_by)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?)
  `).run(
    template.contract_type,
    template.version + 1,
    data.name_fr !== undefined ? data.name_fr : template.name_fr,
    data.name_ar !== undefined ? data.name_ar : template.name_ar,
    data.content_fr !== undefined ? data.content_fr : template.content_fr,
    data.content_ar !== undefined ? data.content_ar : template.content_ar,
    template.created_by
  )
  
  return getTemplateById(result.lastInsertRowid as number)!
}
