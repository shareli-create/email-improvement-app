import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import log from 'electron-log'

/**
 * SQLite Database Schema
 * Stores cached emails and templates locally
 */
class DatabaseSchema {
  private db: Database.Database | null = null

  /**
   * Initialize database
   */
  initialize(): Database.Database {
    if (this.db) {
      return this.db
    }

    const dbPath = join(app.getPath('userData'), 'email-cache.db')
    log.info(`Initializing database at: ${dbPath}`)

    this.db = new Database(dbPath)
    this.createTables()

    log.info('Database initialized successfully')
    return this.db
  }

  /**
   * Create database tables
   */
  private createTables(): void {
    if (!this.db) return

    // Emails table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS emails (
        id TEXT PRIMARY KEY,
        subject TEXT NOT NULL,
        from_name TEXT,
        from_email TEXT,
        to_recipients TEXT,
        body TEXT,
        body_preview TEXT,
        received_date_time TEXT,
        is_draft INTEGER DEFAULT 0,
        conversation_id TEXT,
        synced_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_received ON emails(received_date_time);
      CREATE INDEX IF NOT EXISTS idx_conversation ON emails(conversation_id);
    `)

    // Templates table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        subject TEXT NOT NULL,
        body TEXT NOT NULL,
        category TEXT,
        variables TEXT, -- JSON array of variable names
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Sync metadata table (track last sync time, etc.)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sync_metadata (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `)

    log.info('Database tables created/verified')
  }

  /**
   * Get database instance
   */
  getDatabase(): Database.Database {
    if (!this.db) {
      return this.initialize()
    }
    return this.db
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.db.close()
      this.db = null
      log.info('Database connection closed')
    }
  }
}

export const databaseSchema = new DatabaseSchema()
