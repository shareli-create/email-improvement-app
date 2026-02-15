import type { IpcMain, BrowserWindow } from 'electron'
import log from 'electron-log'
import { claudeService } from '../services/claude-service'
import type { ResponseTone } from '../../shared/types/ipc'

export function setupAIHandlers(ipcMain: IpcMain, mainWindow: BrowserWindow): void {
  // Improve draft
  ipcMain.handle('ai:improve-draft', async (_event, content: string, subject?: string) => {
    try {
      log.info('Improving draft...')
      await claudeService.improveDraft(content, subject, mainWindow)
      return { success: true }
    } catch (error: any) {
      log.error('Failed to improve draft:', error.message)
      throw error
    }
  })

  // Generate response
  ipcMain.handle('ai:generate-response', async (_event, emailId: string, tone: ResponseTone) => {
    try {
      log.info(`Generating ${tone} response for email ${emailId}...`)
      // TODO: Fetch email content by ID from cache
      const emailContent = 'Placeholder email content' // Will be implemented with email service
      await claudeService.generateResponse(emailContent, tone, mainWindow)
      return { success: true }
    } catch (error: any) {
      log.error('Failed to generate response:', error.message)
      throw error
    }
  })

  // Analyze tone
  ipcMain.handle('ai:analyze-tone', async (_event, content: string) => {
    try {
      log.info('Analyzing tone...')
      const analysis = await claudeService.analyzeTone(content)
      return analysis
    } catch (error: any) {
      log.error('Failed to analyze tone:', error.message)
      throw error
    }
  })

  log.info('AI IPC handlers registered')
}
