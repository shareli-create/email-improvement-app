import type { IpcMain } from 'electron'
import log from 'electron-log'
import { storageService } from '../services/storage-service'
import { claudeService } from '../services/claude-service'

export function setupSettingsHandlers(ipcMain: IpcMain): void {
  // Set Claude API key
  ipcMain.handle('settings:set-claude-key', async (_event, key: string) => {
    try {
      log.info('Setting Claude API key...')
      await storageService.setClaudeApiKey(key)
      claudeService.reset() // Reset client to use new key
      return { success: true }
    } catch (error: any) {
      log.error('Failed to set API key:', error.message)
      throw error
    }
  })

  // Get Claude API key (returns masked version)
  ipcMain.handle('settings:get-claude-key', async () => {
    try {
      const key = await storageService.getClaudeApiKey()
      if (!key) {
        return null
      }
      // Return masked version for display (show only last 4 chars)
      return `sk-...${key.slice(-4)}`
    } catch (error: any) {
      log.error('Failed to get API key:', error.message)
      return null
    }
  })

  // Validate Claude API key
  ipcMain.handle('settings:validate-claude-key', async (_event, key: string) => {
    try {
      log.info('Validating Claude API key...')
      const isValid = await claudeService.validateApiKey(key)
      log.info(`API key validation result: ${isValid}`)
      return isValid
    } catch (error: any) {
      log.error('API key validation failed:', error.message)
      return false
    }
  })

  log.info('Settings IPC handlers registered')
}
