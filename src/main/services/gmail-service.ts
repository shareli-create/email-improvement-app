import { google } from 'googleapis'
import { gmailAuthService } from './gmail-auth-service'
import type { Email } from '../../shared/types/ipc'
import log from 'electron-log'

/**
 * Gmail API Service
 * Handles all email operations through Gmail API
 */
class GmailService {
  /**
   * Get Gmail API client
   */
  private getGmailClient() {
    const auth = gmailAuthService.getAuthClient()
    return google.gmail({ version: 'v1', auth })
  }

  /**
   * Fetch inbox messages
   */
  async getInboxMessages(limit: number = 50): Promise<Email[]> {
    try {
      const gmail = this.getGmailClient()

      log.info(`Fetching ${limit} inbox messages from Gmail...`)

      // Get message IDs
      const response = await gmail.users.messages.list({
        userId: 'me',
        maxResults: limit,
        q: 'in:inbox'
      })

      const messages = response.data.messages || []

      // Fetch full message details
      const emails: Email[] = []
      for (const msg of messages) {
        if (msg.id) {
          const email = await this.getEmailById(msg.id)
          if (email) {
            emails.push(email)
          }
        }
      }

      log.info(`Fetched ${emails.length} messages from inbox`)
      return emails
    } catch (error: any) {
      log.error('Failed to fetch inbox:', error.message)
      throw error
    }
  }

  /**
   * Get drafts
   */
  async getDrafts(): Promise<Email[]> {
    try {
      const gmail = this.getGmailClient()

      log.info('Fetching draft messages from Gmail...')

      const response = await gmail.users.drafts.list({
        userId: 'me'
      })

      const drafts = response.data.drafts || []

      const emails: Email[] = []
      for (const draft of drafts) {
        if (draft.message?.id) {
          const email = await this.getEmailById(draft.message.id)
          if (email) {
            email.isDraft = true
            emails.push(email)
          }
        }
      }

      log.info(`Fetched ${emails.length} draft messages`)
      return emails
    } catch (error: any) {
      log.error('Failed to fetch drafts:', error.message)
      throw error
    }
  }

  /**
   * Get a single email by ID
   */
  async getEmailById(emailId: string): Promise<Email | null> {
    try {
      const gmail = this.getGmailClient()

      const response = await gmail.users.messages.get({
        userId: 'me',
        id: emailId,
        format: 'full'
      })

      const message = response.data
      return this.mapToEmail(message)
    } catch (error: any) {
      log.error(`Failed to fetch email ${emailId}:`, error.message)
      return null
    }
  }

  /**
   * Send an email
   */
  async sendEmail(to: string[], subject: string, body: string): Promise<void> {
    try {
      const gmail = this.getGmailClient()

      const email = [
        `To: ${to.join(', ')}`,
        `Subject: ${subject}`,
        'Content-Type: text/html; charset=utf-8',
        '',
        body
      ].join('\n')

      const encodedEmail = Buffer.from(email)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')

      await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedEmail
        }
      })

      log.info(`Email sent to: ${to.join(', ')}`)
    } catch (error: any) {
      log.error('Failed to send email:', error.message)
      throw error
    }
  }

  /**
   * Send a reply to an email
   */
  async sendReply(originalEmail: Email, body: string, subject: string): Promise<void> {
    try {
      const gmail = this.getGmailClient()

      // Get recipient (reply to sender)
      const replyTo = originalEmail.from.email

      // Ensure subject has "Re:" prefix if replying
      const replySubject = subject.startsWith('Re:') ? subject : `Re: ${subject}`

      const email = [
        `To: ${replyTo}`,
        `Subject: ${replySubject}`,
        'Content-Type: text/html; charset=utf-8',
        '',
        body
      ].join('\n')

      const encodedEmail = Buffer.from(email)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')

      await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedEmail,
          threadId: originalEmail.conversationId // Keep in same thread
        }
      })

      log.info(`Reply sent to: ${replyTo}`)
    } catch (error: any) {
      log.error('Failed to send reply:', error.message)
      throw error
    }
  }

  /**
   * Create a draft
   */
  async createDraft(to: string[], subject: string, body: string): Promise<Email> {
    try {
      const gmail = this.getGmailClient()

      const email = [
        `To: ${to.join(', ')}`,
        `Subject: ${subject}`,
        'Content-Type: text/html; charset=utf-8',
        '',
        body
      ].join('\n')

      const encodedEmail = Buffer.from(email)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')

      const response = await gmail.users.drafts.create({
        userId: 'me',
        requestBody: {
          message: {
            raw: encodedEmail
          }
        }
      })

      log.info('Draft created')

      if (response.data.message?.id) {
        const email = await this.getEmailById(response.data.message.id)
        if (email) {
          email.isDraft = true
          return email
        }
      }

      throw new Error('Failed to retrieve created draft')
    } catch (error: any) {
      log.error('Failed to create draft:', error.message)
      throw error
    }
  }

  /**
   * Map Gmail message to our Email type
   */
  private mapToEmail(message: any): Email {
    const headers = message.payload?.headers || []

    const getHeader = (name: string) => {
      const header = headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())
      return header?.value || ''
    }

    const from = this.parseEmailAddress(getHeader('From'))
    const to = this.parseEmailAddresses(getHeader('To'))
    const subject = getHeader('Subject')
    const date = getHeader('Date')

    // Get email body
    let body = ''
    let bodyPreview = ''

    if (message.payload?.body?.data) {
      body = Buffer.from(message.payload.body.data, 'base64').toString('utf-8')
    } else if (message.payload?.parts) {
      // Multi-part message
      for (const part of message.payload.parts) {
        if (part.mimeType === 'text/html' && part.body?.data) {
          body = Buffer.from(part.body.data, 'base64').toString('utf-8')
          break
        } else if (part.mimeType === 'text/plain' && part.body?.data) {
          body = Buffer.from(part.body.data, 'base64').toString('utf-8')
        }
      }
    }

    // Create preview (first 150 chars of body without HTML)
    bodyPreview = body.replace(/<[^>]*>/g, '').substring(0, 150)
    if (message.snippet) {
      bodyPreview = message.snippet
    }

    return {
      id: message.id || '',
      subject: subject || '(No Subject)',
      from: from,
      to: to,
      body: body,
      bodyPreview: bodyPreview,
      receivedDateTime: date || new Date().toISOString(),
      isDraft: false,
      conversationId: message.threadId
    }
  }

  /**
   * Parse email address from "Name <email@example.com>" format
   */
  private parseEmailAddress(addressString: string): { name: string; email: string } {
    const match = addressString.match(/(.*?)\s*<(.+?)>/)
    if (match) {
      return {
        name: match[1].trim().replace(/"/g, ''),
        email: match[2].trim()
      }
    }

    return {
      name: addressString.split('@')[0] || 'Unknown',
      email: addressString.trim()
    }
  }

  /**
   * Parse multiple email addresses
   */
  private parseEmailAddresses(addressString: string): Array<{ name: string; email: string }> {
    if (!addressString) return []

    const addresses = addressString.split(',')
    return addresses.map((addr) => this.parseEmailAddress(addr.trim()))
  }
}

export const gmailService = new GmailService()
