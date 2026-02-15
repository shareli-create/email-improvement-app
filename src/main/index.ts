import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import log from 'electron-log'
import dotenv from 'dotenv'
import { setupAuthHandlers } from './ipc/auth-handler'
import { setupEmailHandlers } from './ipc/email-handler'
import { setupAIHandlers } from './ipc/ai-handler'
import { setupSettingsHandlers } from './ipc/settings-handler'
import { setupTemplateHandlers } from './ipc/template-handler'
import { databaseSchema } from './database/schema'

// Load environment variables from .env file
dotenv.config()

// Configure logging
log.initialize()
log.info('Email Improvement App starting...')

// Initialize database
databaseSchema.initialize()
log.info('Database initialized')

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    show: false,
    backgroundColor: '#1e293b', // slate-900
    webPreferences: {
      // Security: Critical settings
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      nodeIntegrationInWorker: false,
      nodeIntegrationInSubFrames: false,
      preload: join(__dirname, '../preload/index.js')
    }
  })

  // Show window when ready (prevents flash)
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
    log.info('Window ready and shown')
  })

  // Load the renderer
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// Setup IPC handlers
function setupIPC(): void {
  log.info('Setting up IPC handlers...')

  if (!mainWindow) {
    log.error('Cannot setup IPC: mainWindow is null')
    return
  }

  setupAuthHandlers(ipcMain)
  setupEmailHandlers(ipcMain)
  setupAIHandlers(ipcMain, mainWindow)
  setupSettingsHandlers(ipcMain)
  setupTemplateHandlers(ipcMain)

  log.info('IPC handlers setup complete')
}

// App lifecycle
app.whenReady().then(() => {
  log.info('App ready, creating window...')
  createWindow()
  setupIPC()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Error handling
process.on('uncaughtException', (error) => {
  log.error('Uncaught exception:', error)
})

process.on('unhandledRejection', (reason) => {
  log.error('Unhandled rejection:', reason)
})
