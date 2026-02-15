import { safeStorage, app } from 'electron'
import Store from 'electron-store'
import log from 'electron-log'

interface StoreSchema {
  claude_api_key?: string
  microsoft_tokens?: string
  user_preferences?: {
    theme?: 'light' | 'dark'
    autoSync?: boolean
    syncInterval?: number
  }
}

/**
 * Secure storage service using Electron's safeStorage API
 * Credentials are encrypted using OS-level encryption (Keychain on Mac, DPAPI on Windows)
 */
class StorageService {
  private store: Store<StoreSchema>

  constructor() {
    this.store = new Store<StoreSchema>({
      name: 'email-app-config',
      encryptionKey: 'email-improvement-app-secure-key'
    })

    log.info('Storage service initialized')
  }

  /**
   * Securely store Claude API key using OS-level encryption
   */
  async setClaudeApiKey(key: string): Promise<void> {
    try {
      if (!safeStorage.isEncryptionAvailable()) {
        log.error('Encryption not available on this system')
        throw new Error('Secure storage not available')
      }

      const encrypted = safeStorage.encryptString(key)
      this.store.set('claude_api_key', encrypted.toString('base64'))
      log.info('Claude API key stored securely')
    } catch (error) {
      log.error('Failed to store Claude API key:', error)
      throw error
    }
  }

  /**
   * Retrieve and decrypt Claude API key
   */
  async getClaudeApiKey(): Promise<string | null> {
    try {
      const encrypted = this.store.get('claude_api_key')
      if (!encrypted) {
        return null
      }

      if (!safeStorage.isEncryptionAvailable()) {
        log.error('Encryption not available on this system')
        return null
      }

      const buffer = Buffer.from(encrypted, 'base64')
      const decrypted = safeStorage.decryptString(buffer)
      return decrypted
    } catch (error) {
      log.error('Failed to retrieve Claude API key:', error)
      return null
    }
  }

  /**
   * Delete Claude API key
   */
  async deleteClaudeApiKey(): Promise<void> {
    this.store.delete('claude_api_key')
    log.info('Claude API key deleted')
  }

  /**
   * Store Microsoft OAuth tokens (encrypted)
   */
  async setMicrosoftTokens(tokens: any): Promise<void> {
    try {
      if (!safeStorage.isEncryptionAvailable()) {
        throw new Error('Secure storage not available')
      }

      const encrypted = safeStorage.encryptString(JSON.stringify(tokens))
      this.store.set('microsoft_tokens', encrypted.toString('base64'))
      log.info('Microsoft tokens stored securely')
    } catch (error) {
      log.error('Failed to store Microsoft tokens:', error)
      throw error
    }
  }

  /**
   * Retrieve Microsoft OAuth tokens
   */
  async getMicrosoftTokens(): Promise<any | null> {
    try {
      const encrypted = this.store.get('microsoft_tokens')
      if (!encrypted) {
        return null
      }

      if (!safeStorage.isEncryptionAvailable()) {
        return null
      }

      const buffer = Buffer.from(encrypted, 'base64')
      const decrypted = safeStorage.decryptString(buffer)
      return JSON.parse(decrypted)
    } catch (error) {
      log.error('Failed to retrieve Microsoft tokens:', error)
      return null
    }
  }

  /**
   * Delete Microsoft tokens (logout)
   */
  async deleteMicrosoftTokens(): Promise<void> {
    this.store.delete('microsoft_tokens')
    log.info('Microsoft tokens deleted')
  }

  /**
   * Get user preferences
   */
  getPreferences(): StoreSchema['user_preferences'] {
    return this.store.get('user_preferences', {
      theme: 'dark',
      autoSync: true,
      syncInterval: 5
    })
  }

  /**
   * Update user preferences
   */
  setPreferences(prefs: StoreSchema['user_preferences']): void {
    this.store.set('user_preferences', prefs)
    log.info('User preferences updated')
  }

  /**
   * Clear all data (for testing or reset)
   */
  clearAll(): void {
    this.store.clear()
    log.info('All storage data cleared')
  }
}

// Export singleton instance
export const storageService = new StorageService()
