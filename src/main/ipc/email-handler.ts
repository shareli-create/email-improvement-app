import type { IpcMain } from 'electron'
import log from 'electron-log'
import type { Email } from '../../shared/types/ipc'
import { gmailService } from '../services/gmail-service'
import { cacheService } from '../services/cache-service'

export function setupEmailHandlers(ipcMain: IpcMain): void {
  // Fetch inbox - always fetches fresh emails from Gmail
  ipcMain.handle('emails:fetch-inbox', async (_event, limit?: number) => {
    try {
      log.info(`Fetching inbox (limit: ${limit || 50})`)

      // Always fetch fresh emails from Gmail
      const emails = await gmailService.getInboxMessages(limit || 50)

      // Update cache with fresh emails
      if (emails.length > 0) {
        cacheService.cacheEmails(emails)
        log.info(`Fetched and cached ${emails.length} fresh emails from Gmail`)
      }

      return emails
    } catch (error: any) {
      log.error('Failed to fetch inbox:', error.message)

      // Return cached emails on error as fallback
      const cachedEmails = cacheService.getCachedEmails(limit || 50, false)
      if (cachedEmails.length > 0) {
        log.info('Returning cached emails due to fetch error')
        return cachedEmails
      }

      throw error
    }
  })

  // Get single email
  ipcMain.handle('emails:get', async (_event, id: string) => {
    try {
      log.info(`Fetching email ${id}`)

      // Try cache first
      const cachedEmail = cacheService.getEmailById(id)
      if (cachedEmail) {
        return cachedEmail
      }

      // Fetch from Gmail API
      const email = await gmailService.getEmailById(id)

      // Cache it
      if (email) {
        cacheService.cacheEmails([email])
      }

      return email
    } catch (error: any) {
      log.error('Failed to get email:', error.message)
      throw error
    }
  })

  // Get drafts
  ipcMain.handle('emails:get-drafts', async () => {
    try {
      log.info('Fetching drafts')

      // Try cache first
      const cachedDrafts = cacheService.getCachedEmails(50, true)

      if (cachedDrafts.length > 0) {
        log.info(`Returning ${cachedDrafts.length} drafts from cache`)
        return cachedDrafts
      }

      // Fetch from Gmail API
      const drafts = await gmailService.getDrafts()

      // Cache them
      if (drafts.length > 0) {
        cacheService.cacheEmails(drafts)
      }

      return drafts
    } catch (error: any) {
      log.error('Failed to get drafts:', error.message)

      // Return cached drafts on error
      const cachedDrafts = cacheService.getCachedEmails(50, true)
      if (cachedDrafts.length > 0) {
        log.info('Returning cached drafts due to fetch error')
        return cachedDrafts
      }

      throw error
    }
  })

  // Sync emails
  ipcMain.handle('emails:sync', async () => {
    try {
      log.info('Syncing emails from Gmail...')

      // Fetch latest emails
      const emails = await gmailService.getInboxMessages(50)

      // Update cache
      cacheService.cacheEmails(emails)

      // Update sync timestamp
      cacheService.setSyncMetadata('last_sync', new Date().toISOString())

      log.info(`Sync complete: ${emails.length} emails synced`)
      return { success: true, count: emails.length }
    } catch (error: any) {
      log.error('Failed to sync emails:', error.message)
      throw error
    }
  })

  // Send reply
  ipcMain.handle('emails:send-reply', async (_event, emailId: string, body: string, subject: string) => {
    try {
      log.info(`Sending reply to email ${emailId}`)

      // Get the original email to get sender info
      const originalEmail = cacheService.getEmailById(emailId)
      if (!originalEmail) {
        throw new Error('Original email not found')
      }

      // Send the reply
      await gmailService.sendReply(originalEmail, body, subject)

      log.info('Reply sent successfully')
      return { success: true }
    } catch (error: any) {
      log.error('Failed to send reply:', error.message)
      throw error
    }
  })

  log.info('Email IPC handlers registered')
}
