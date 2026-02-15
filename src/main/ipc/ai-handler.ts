import type { IpcMain, BrowserWindow } from 'electron'
import log from 'electron-log'
import { claudeService } from '../services/claude-service'
import { cacheService } from '../services/cache-service'
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

      // Fetch the actual email content from cache
      const email = cacheService.getEmailById(emailId)
      if (!email) {
        throw new Error('Email not found')
      }

      // Format the email content for context
      const emailContext = `Subject: ${email.subject}
From: ${email.from?.name || email.from?.email || 'Unknown'}
Date: ${email.receivedDateTime ? new Date(email.receivedDateTime).toLocaleString() : 'Unknown'}

${email.body || email.bodyPreview || 'No content available'}`

      await claudeService.generateResponse(emailContext, tone, mainWindow)
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
