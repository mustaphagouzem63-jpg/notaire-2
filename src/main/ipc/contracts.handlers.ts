// ============================================================
// CONTRACTS IPC HANDLERS
// ============================================================

import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '@shared/types/ipc'
import {
  findAllContracts,
  findContractById,
  createContract,
  updateContract,
  transitionContract,
  softDeleteContract,
  generateContractNumber,
  searchContracts
} from '../database/repositories/contracts'
import { generateContractPdf } from '../services/pdf.service'
import { getTemplateByType } from '../database/repositories/templates'
import { logAction } from '../database/repositories/audit'
import { AuditActionType, AuditEntityType } from '@shared/types/enums'
import type { ContractStatus, ContractType } from '@shared/types/enums'

export function registerContractsHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.CONTRACTS_LIST, async (_, params) => {
    return findAllContracts(params)
  })

  ipcMain.handle(IPC_CHANNELS.CONTRACTS_GET, async (_, id: number) => {
    return findContractById(id)
  })

  ipcMain.handle(IPC_CHANNELS.CONTRACTS_GENERATE_NUMBER, async () => {
    return generateContractNumber()
  })

  ipcMain.handle(IPC_CHANNELS.CONTRACTS_CREATE, async (_, data, sessionData) => {
    const number = generateContractNumber()
    
    // Auto-fetch template content if not provided
    let contentAr = data.content_ar
    let contentFr = data.content_fr
    
    if (!contentAr || !contentFr) {
      const template = getTemplateByType(data.contract_type as ContractType)
      if (template) {
        contentAr = contentAr || template.content_ar
        contentFr = contentFr || template.content_fr
      }
    }
    
    const contract = createContract({
      ...data,
      contract_number: number,
      content_ar: contentAr,
      content_fr: contentFr,
      created_by: sessionData?.user?.id
    })
    
    if (sessionData?.user) {
      logAction({
        user_id: sessionData.user.id,
        username: sessionData.user.username,
        action_type: AuditActionType.CREATE,
        entity_type: AuditEntityType.CONTRACT,
        entity_id: contract.id,
        description: `Created contract: ${contract.contract_number}`,
        session_id: sessionData.token
      })
    }
    
    return contract
  })

  ipcMain.handle(IPC_CHANNELS.CONTRACTS_UPDATE, async (_, id: number, data, sessionData) => {
    const contract = updateContract(id, data)
    
    if (sessionData?.user) {
      logAction({
        user_id: sessionData.user.id,
        username: sessionData.user.username,
        action_type: AuditActionType.UPDATE,
        entity_type: AuditEntityType.CONTRACT,
        entity_id: contract.id,
        description: `Updated contract: ${contract.contract_number}`,
        session_id: sessionData.token
      })
    }
    
    return contract
  })

  ipcMain.handle(IPC_CHANNELS.CONTRACTS_TRANSITION, async (_, id: number, status: ContractStatus, sessionData) => {
    if (!sessionData?.user) throw new Error('Unauthorized')
      
    const contract = transitionContract(id, status, sessionData.user.id)
    
    let actionType = AuditActionType.UPDATE
    if (status === 'approved') actionType = AuditActionType.APPROVE
    if (status === 'finalized') actionType = AuditActionType.FINALIZE
    
    logAction({
      user_id: sessionData.user.id,
      username: sessionData.user.username,
      action_type: actionType,
      entity_type: AuditEntityType.CONTRACT,
      entity_id: contract.id,
      description: `Transitioned contract to ${status}`,
      session_id: sessionData.token
    })
    
    return contract
  })

  ipcMain.handle(IPC_CHANNELS.CONTRACTS_DELETE, async (_, id: number, sessionData) => {
    const contract = findContractById(id)
    if (!contract) return false
    
    softDeleteContract(id)
    
    if (sessionData?.user) {
      logAction({
        user_id: sessionData.user.id,
        username: sessionData.user.username,
        action_type: AuditActionType.DELETE,
        entity_type: AuditEntityType.CONTRACT,
        entity_id: id,
        description: `Deleted contract: ${contract.contract_number}`,
        session_id: sessionData.token
      })
    }
    
    return true
  })

  ipcMain.handle(IPC_CHANNELS.CONTRACTS_GENERATE_PDF, async (_, id: number, sessionData) => {
    const contract = findContractById(id)
    if (!contract) throw new Error('Contract not found')
      
    const templateContentFr = contract.content_fr || ''
    const templateContentAr = contract.content_ar || ''
    
    const pdfPath = await generateContractPdf(contract, templateContentFr, templateContentAr)
    
    // Update contract with PDF path
    const updatedContract = updateContract(id, { pdf_path: pdfPath })
    
    if (sessionData?.user) {
      logAction({
        user_id: sessionData.user.id,
        username: sessionData.user.username,
        action_type: AuditActionType.EXPORT,
        entity_type: AuditEntityType.CONTRACT,
        entity_id: id,
        description: `Generated PDF for contract: ${contract.contract_number}`,
        session_id: sessionData.token
      })
    }
    
    return updatedContract
  })

  ipcMain.handle(IPC_CHANNELS.CONTRACTS_SEARCH, async (_, query: string) => {
    return searchContracts(query)
  })
}
