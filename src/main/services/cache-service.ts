import { databaseSchema } from '../database/schema'
import type { Email, Template } from '../../shared/types/ipc'
import log from 'electron-log'

/**
 * Cache Service
 * Handles local caching of emails and templates in SQLite
 */
class CacheService {
  /**
   * Cache emails to database
   */
  cacheEmails(emails: Email[]): void {
    const db = databaseSchema.getDatabase()

    const insertStmt = db.prepare(`
      INSERT OR REPLACE INTO emails (
        id, subject, from_name, from_email, to_recipients,
        body, body_preview, received_date_time, is_draft, conversation_id, synced_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `)

    const insertMany = db.transaction((emails: Email[]) => {
      for (const email of emails) {
        insertStmt.run(
          email.id,
          email.subject,
          email.from.name,
          email.from.email,
          JSON.stringify(email.to),
          email.body,
          email.bodyPreview,
          email.receivedDateTime,
          email.isDraft ? 1 : 0,
          email.conversationId || null
        )
      }
    })

    insertMany(emails)
    log.info(`Cached ${emails.length} emails to database`)
  }

  /**
   * Get cached emails
   */
  getCachedEmails(limit: number = 50, isDraft: boolean = false): Email[] {
    const db = databaseSchema.getDatabase()

    const stmt = db.prepare(`
      SELECT * FROM emails
      WHERE is_draft = ?
      ORDER BY received_date_time DESC
      LIMIT ?
    `)

    const rows = stmt.all(isDraft ? 1 : 0, limit) as any[]

    return rows.map((row) => this.mapRowToEmail(row))
  }

  /**
   * Get email by ID
   */
  getEmailById(emailId: string): Email | null {
    const db = databaseSchema.getDatabase()

    const stmt = db.prepare('SELECT * FROM emails WHERE id = ?')
    const row = stmt.get(emailId) as any

    if (!row) return null

    return this.mapRowToEmail(row)
  }

  /**
   * Get emails in a conversation
   */
  getConversationEmails(conversationId: string): Email[] {
    const db = databaseSchema.getDatabase()

    const stmt = db.prepare(`
      SELECT * FROM emails
      WHERE conversation_id = ?
      ORDER BY received_date_time ASC
    `)

    const rows = stmt.all(conversationId) as any[]
    return rows.map((row) => this.mapRowToEmail(row))
  }

  /**
   * Search emails
   */
  searchEmails(query: string, limit: number = 20): Email[] {
    const db = databaseSchema.getDatabase()

    const stmt = db.prepare(`
      SELECT * FROM emails
      WHERE subject LIKE ? OR body_preview LIKE ? OR from_name LIKE ?
      ORDER BY received_date_time DESC
      LIMIT ?
    `)

    const searchPattern = `%${query}%`
    const rows = stmt.all(searchPattern, searchPattern, searchPattern, limit) as any[]

    return rows.map((row) => this.mapRowToEmail(row))
  }

  /**
   * Map database row to Email object
   */
  private mapRowToEmail(row: any): Email {
    return {
      id: row.id,
      subject: row.subject,
      from: {
        name: row.from_name || '',
        email: row.from_email || ''
      },
      to: row.to_recipients ? JSON.parse(row.to_recipients) : [],
      body: row.body || '',
      bodyPreview: row.body_preview || '',
      receivedDateTime: row.received_date_time,
      isDraft: row.is_draft === 1,
      conversationId: row.conversation_id
    }
  }

  /**
   * Clear all cached emails
   */
  clearEmailCache(): void {
    const db = databaseSchema.getDatabase()
    db.prepare('DELETE FROM emails').run()
    log.info('Email cache cleared')
  }

  /**
   * Get all templates
   */
  getAllTemplates(): Template[] {
    const db = databaseSchema.getDatabase()

    const stmt = db.prepare(`
      SELECT * FROM templates
      ORDER BY created_at DESC
    `)

    const rows = stmt.all() as any[]

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      subject: row.subject,
      body: row.body,
      category: row.category,
      variables: row.variables ? JSON.parse(row.variables) : [],
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }))
  }

  /**
   * Create template
   */
  createTemplate(template: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>): Template {
    const db = databaseSchema.getDatabase()

    const id = Date.now().toString()
    const now = new Date().toISOString()

    const stmt = db.prepare(`
      INSERT INTO templates (id, name, subject, body, category, variables, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(
      id,
      template.name,
      template.subject,
      template.body,
      template.category || null,
      JSON.stringify(template.variables),
      now,
      now
    )

    log.info(`Template created: ${template.name}`)

    return {
      id,
      ...template,
      createdAt: now,
      updatedAt: now
    }
  }

  /**
   * Update template
   */
  updateTemplate(id: string, updates: Partial<Template>): Template | null {
    const db = databaseSchema.getDatabase()

    const fields: string[] = []
    const values: any[] = []

    if (updates.name !== undefined) {
      fields.push('name = ?')
      values.push(updates.name)
    }
    if (updates.subject !== undefined) {
      fields.push('subject = ?')
      values.push(updates.subject)
    }
    if (updates.body !== undefined) {
      fields.push('body = ?')
      values.push(updates.body)
    }
    if (updates.category !== undefined) {
      fields.push('category = ?')
      values.push(updates.category)
    }
    if (updates.variables !== undefined) {
      fields.push('variables = ?')
      values.push(JSON.stringify(updates.variables))
    }

    fields.push('updated_at = ?')
    values.push(new Date().toISOString())
    values.push(id)

    const stmt = db.prepare(`
      UPDATE templates
      SET ${fields.join(', ')}
      WHERE id = ?
    `)

    stmt.run(...values)

    // Return updated template
    const getStmt = db.prepare('SELECT * FROM templates WHERE id = ?')
    const row = getStmt.get(id) as any

    if (!row) return null

    return {
      id: row.id,
      name: row.name,
      subject: row.subject,
      body: row.body,
      category: row.category,
      variables: row.variables ? JSON.parse(row.variables) : [],
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }
  }

  /**
   * Delete template
   */
  deleteTemplate(id: string): void {
    const db = databaseSchema.getDatabase()
    db.prepare('DELETE FROM templates WHERE id = ?').run(id)
    log.info(`Template deleted: ${id}`)
  }

  /**
   * Set sync metadata
   */
  setSyncMetadata(key: string, value: string): void {
    const db = databaseSchema.getDatabase()

    const stmt = db.prepare(`
      INSERT OR REPLACE INTO sync_metadata (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `)

    stmt.run(key, value)
  }

  /**
   * Get sync metadata
   */
  getSyncMetadata(key: string): string | null {
    const db = databaseSchema.getDatabase()

    const stmt = db.prepare('SELECT value FROM sync_metadata WHERE key = ?')
    const row = stmt.get(key) as any

    return row ? row.value : null
  }
}

export const cacheService = new CacheService()
