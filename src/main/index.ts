// ============================================================
// ELECTRON MAIN PROCESS — Entry point
// ============================================================

import { app, BrowserWindow, shell } from 'electron'
import path from 'path'
import fs from 'fs'
import { initializeDatabase } from './database/schema'
import { closeDatabase } from './database/connection'
import { registerIpcHandlers } from './ipc/register-all'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  console.log('Creating window...')
  try {
    mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 1024,
      minHeight: 700,
      show: true,
      title: 'Notary Office | مكتب التوثيق',
      backgroundColor: '#0f0f1a',
      autoHideMenuBar: true,
      webPreferences: {
        preload: path.join(__dirname, '../preload/index.js'),
        sandbox: false,
        contextIsolation: true,
        nodeIntegration: false
      }
    })

    console.log('BrowserWindow created.')

    // Open devtools only in dev mode
    if (process.env.NODE_ENV === 'development') {
      mainWindow.webContents.openDevTools()
    }

    // Show maximized once ready to avoid white flash
    mainWindow.on('ready-to-show', () => {
      console.log('ready-to-show fired!')
      mainWindow?.show()
      mainWindow?.maximize()
    })

    // Open external links in system browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url)
      return { action: 'deny' }
    })

    // Load renderer: dev server URL in dev, built file in production
    if (process.env.ELECTRON_RENDERER_URL) {
      console.log('Loading URL:', process.env.ELECTRON_RENDERER_URL)
      mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL).catch(e => console.error('Failed to load URL', e))
    } else {
      console.log('Loading file index.html')
      mainWindow.loadFile(path.join(__dirname, '../renderer/index.html')).catch(e => console.error('Failed to load file', e))
    }
    console.log('createWindow finished successfully.')
  } catch (err) {
    console.error('Error in createWindow:', err)
  }
}

/**
 * Create required storage directories under userData.
 */
function ensureDirectories(): void {
  const userDataPath = app.getPath('userData')
  const dirs = [
    path.join(userDataPath, 'data'),
    path.join(userDataPath, 'documents'),
    path.join(userDataPath, 'documents', 'contracts'),
    path.join(userDataPath, 'documents', 'uploads'),
    path.join(userDataPath, 'backups')
  ]

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  }
}

// ── Single Instance Lock ──────────────────────────────────────
// Disable Hardware Acceleration to prevent "GPU process isn't usable" error on some Windows machines
app.disableHardwareAcceleration()
app.commandLine.appendSwitch('disable-gpu')
app.commandLine.appendSwitch('disable-software-rasterizer')
app.commandLine.appendSwitch('no-sandbox')

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  app.whenReady().then(() => {
    ensureDirectories()
    initializeDatabase()
    registerIpcHandlers()
    createWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
      }
    })
  })

  app.on('window-all-closed', () => {
    closeDatabase()
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })
}
