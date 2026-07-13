// ============================================================
// DIALOG IPC HANDLERS (Native OS dialogs)
// ============================================================

import { ipcMain, dialog } from 'electron'
import { IPC_CHANNELS } from '@shared/types/ipc'
import fs from 'fs'
import path from 'path'

export function registerDialogHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.SYSTEM_SHOW_ERROR, async (_, title: string, content: string) => {
    return dialog.showErrorBox(title, content)
  })

  ipcMain.handle(IPC_CHANNELS.SYSTEM_SHOW_MESSAGE, async (_, options) => {
    return dialog.showMessageBox(options)
  })

  ipcMain.handle(IPC_CHANNELS.DIALOG_OPEN_FILE, async (_, options) => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      ...options
    })
    return { canceled, filePaths }
  })

  ipcMain.handle(IPC_CHANNELS.DIALOG_SAVE_FILE, async (_, defaultPath: string) => {
    const { canceled, filePath } = await dialog.showSaveDialog({
      defaultPath,
      properties: ['createDirectory', 'showOverwriteConfirmation']
    })
    return { canceled, filePath }
  })

  ipcMain.handle(IPC_CHANNELS.DIALOG_SELECT_DIRECTORY, async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory']
    })
    return { canceled, filePaths }
  })

  ipcMain.handle(IPC_CHANNELS.SYSTEM_COPY_FILE_TO, async (_, sourcePath: string, destPath: string) => {
    try {
      if (!fs.existsSync(sourcePath)) return false
      
      const dir = path.dirname(destPath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      
      fs.copyFileSync(sourcePath, destPath)
      return true
    } catch (e) {
      console.error(e)
      return false
    }
  })
}
