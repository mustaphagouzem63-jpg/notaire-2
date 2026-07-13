// ============================================================
// DOCUMENTS IPC HANDLERS
// ============================================================

import { ipcMain, app, shell } from 'electron'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import { IPC_CHANNELS } from '@shared/types/ipc'
import {
  findAllDocuments,
  findDocumentById,
  createDocument,
  deleteDocument,
  getDocumentVersions,
  createDocumentVersion,
  restoreDocumentVersion
} from '../database/repositories/documents'
import { logAction } from '../database/repositories/audit'
import { AuditActionType, AuditEntityType } from '@shared/types/enums'

export function registerDocumentsHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.DOCUMENTS_LIST, async (_, params) => {
    return findAllDocuments(params)
  })

  ipcMain.handle(IPC_CHANNELS.DOCUMENTS_GET, async (_, id: number) => {
    return findDocumentById(id)
  })

  ipcMain.handle(IPC_CHANNELS.DOCUMENTS_UPLOAD, async (_, data, fileBuffer: ArrayBuffer, sessionData) => {
    try {
      const buffer = Buffer.from(fileBuffer)
      
      // Save file to userData
      const uploadsDir = path.join(app.getPath('userData'), 'documents', 'uploads')
      
      // Generate a unique file name to avoid collisions
      const ext = path.extname(data.file_name)
      const hash = crypto.randomBytes(8).toString('hex')
      const uniqueFileName = `${Date.now()}-${hash}${ext}`
      const filePath = path.join(uploadsDir, uniqueFileName)
      
      fs.writeFileSync(filePath, buffer)
      
      const docData = {
        ...data,
        file_path: filePath,
        file_size: buffer.length,
        uploaded_by: sessionData?.user?.id
      }
      
      let document
      
      if (data.parent_document_id) {
        document = createDocumentVersion(data.parent_document_id, docData)
      } else {
        document = createDocument(docData)
      }
      
      if (sessionData?.user) {
        logAction({
          user_id: sessionData.user.id,
          username: sessionData.user.username,
          action_type: AuditActionType.CREATE,
          entity_type: AuditEntityType.DOCUMENT,
          entity_id: document.id,
          description: `Uploaded document: ${document.file_name}`,
          session_id: sessionData.token
        })
      }
      
      return document
    } catch (error) {
      console.error('Error uploading document:', error)
      throw error
    }
  })

  ipcMain.handle(IPC_CHANNELS.DOCUMENTS_DELETE, async (_, id: number, sessionData) => {
    const document = findDocumentById(id)
    if (!document) return false
      
    deleteDocument(id)
    
    // Note: We don't delete the actual file to keep it if previous versions use it
    // A cleanup job could be added later for orphaned files
    
    if (sessionData?.user) {
      logAction({
        user_id: sessionData.user.id,
        username: sessionData.user.username,
        action_type: AuditActionType.DELETE,
        entity_type: AuditEntityType.DOCUMENT,
        entity_id: id,
        description: `Deleted document: ${document.file_name}`,
        session_id: sessionData.token
      })
    }
    
    return true
  })

  ipcMain.handle(IPC_CHANNELS.DOCUMENTS_GET_VERSIONS, async (_, documentId: number) => {
    return getDocumentVersions(documentId)
  })

  ipcMain.handle(IPC_CHANNELS.DOCUMENTS_RESTORE_VERSION, async (_, versionId: number, sessionData) => {
    const document = restoreDocumentVersion(versionId)
    
    if (sessionData?.user) {
      logAction({
        user_id: sessionData.user.id,
        username: sessionData.user.username,
        action_type: AuditActionType.RESTORE,
        entity_type: AuditEntityType.DOCUMENT,
        entity_id: document.id,
        description: `Restored document version ${document.version}: ${document.file_name}`,
        session_id: sessionData.token
      })
    }
    
    return document
  })

  ipcMain.handle(IPC_CHANNELS.DOCUMENTS_OPEN, async (_, id: number) => {
    const document = findDocumentById(id)
    if (!document) throw new Error('Document not found')
      
    if (fs.existsSync(document.file_path)) {
      await shell.openPath(document.file_path)
      return true
    }
    
    throw new Error('File not found on disk')
  })

  ipcMain.handle(IPC_CHANNELS.DOCUMENTS_RUN_OCR, async () => {
    // Return a mock result for now since we skipped Tesseract
    return { success: false, message: 'OCR is not available in this build' }
  })
}
