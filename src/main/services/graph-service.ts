import { Client } from '@microsoft/microsoft-graph-client'
import log from 'electron-log'
import { authService } from './auth-service'
import type { Email } from '../../shared/types/ipc'

/**
 * Microsoft Graph API Service
 * Handles all email operations through Microsoft Graph
 */
class GraphService {
  private client: Client | null = null

  /**
   * Initialize Graph client with access token
   */
  private async getClient(): Promise<Client> {
    if (this.client) {
      return this.client
    }

    const accessToken = await authService.getAccessToken()

    this.client = Client.init({
      authProvider: (done) => {
        done(null, accessToken)
      }
    })

    return this.client
  }

  /**
   * Reset client (call this after logout or token refresh)
   */
  resetClient(): void {
    this.client = null
  }

  /**
   * Fetch inbox messages
   */
  async getInboxMessages(limit: number = 50): Promise<Email[]> {
    try {
      const client = await this.getClient()

      log.info(`Fetching ${limit} inbox messages...`)

      const response = await client
        .api('/me/mailFolders/inbox/messages')
        .top(limit)
        .select('id,subject,from,toRecipients,body,bodyPreview,receivedDateTime,isDraft,conversationId')
        .orderby('receivedDateTime DESC')
        .get()

      const emails: Email[] = response.value.map((msg: any) => this.mapToEmail(msg))

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
      const client = await this.getClient()

      log.info('Fetching draft messages...')

      const response = await client
        .api('/me/mailFolders/drafts/messages')
        .select('id,subject,from,toRecipients,body,bodyPreview,receivedDateTime,isDraft,conversationId')
        .orderby('lastModifiedDateTime DESC')
        .get()

      const emails: Email[] = response.value.map((msg: any) => this.mapToEmail(msg))

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
      const client = await this.getClient()

      log.info(`Fetching email: ${emailId}`)

      const message = await client
        .api(`/me/messages/${emailId}`)
        .select('id,subject,from,toRecipients,body,bodyPreview,receivedDateTime,isDraft,conversationId')
        .get()

      return this.mapToEmail(message)
    } catch (error: any) {
      log.error(`Failed to fetch email ${emailId}:`, error.message)
      return null
    }
  }

  /**
   * Get messages in a conversation thread
   */
  async getConversationMessages(conversationId: string): Promise<Email[]> {
    try {
      const client = await this.getClient()

      log.info(`Fetching conversation: ${conversationId}`)

      const response = await client
        .api('/me/messages')
        .filter(`conversationId eq '${conversationId}'`)
        .select('id,subject,from,toRecipients,body,bodyPreview,receivedDateTime,isDraft,conversationId')
        .orderby('receivedDateTime ASC')
        .get()

      return response.value.map((msg: any) => this.mapToEmail(msg))
    } catch (error: any) {
      log.error('Failed to fetch conversation:', error.message)
      throw error
    }
  }

  /**
   * Send an email
   */
  async sendEmail(to: string[], subject: string, body: string): Promise<void> {
    try {
      const client = await this.getClient()

      const message = {
        subject,
        body: {
          contentType: 'HTML',
          content: body
        },
        toRecipients: to.map((email) => ({
          emailAddress: { address: email }
        }))
      }

      await client.api('/me/sendMail').post({ message })

      log.info(`Email sent to: ${to.join(', ')}`)
    } catch (error: any) {
      log.error('Failed to send email:', error.message)
      throw error
    }
  }

  /**
   * Create a draft
   */
  async createDraft(to: string[], subject: string, body: string): Promise<Email> {
    try {
      const client = await this.getClient()

      const draft = {
        subject,
        body: {
          contentType: 'HTML',
          content: body
        },
        toRecipients: to.map((email) => ({
          emailAddress: { address: email }
        }))
      }

      const response = await client.api('/me/messages').post(draft)

      log.info('Draft created')
      return this.mapToEmail(response)
    } catch (error: any) {
      log.error('Failed to create draft:', error.message)
      throw error
    }
  }

  /**
   * Map Microsoft Graph message to our Email type
   */
  private mapToEmail(message: any): Email {
    return {
      id: message.id,
      subject: message.subject || '(No Subject)',
      from: {
        name: message.from?.emailAddress?.name || 'Unknown',
        email: message.from?.emailAddress?.address || ''
      },
      to: message.toRecipients?.map((recipient: any) => ({
        name: recipient.emailAddress?.name || '',
        email: recipient.emailAddress?.address || ''
      })) || [],
      body: message.body?.content || '',
      bodyPreview: message.bodyPreview || '',
      receivedDateTime: message.receivedDateTime || new Date().toISOString(),
      isDraft: message.isDraft || false,
      conversationId: message.conversationId
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(): Promise<any> {
    try {
      const client = await this.getClient()
      const profile = await client.api('/me').get()
      return profile
    } catch (error: any) {
      log.error('Failed to get user profile:', error.message)
      throw error
    }
  }
}

export const graphService = new GraphService()
