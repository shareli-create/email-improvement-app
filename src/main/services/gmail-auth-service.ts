import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'
import { BrowserWindow, shell } from 'electron'
import log from 'electron-log'
import { storageService } from './storage-service'
import { createServer } from 'http'

/**
 * Gmail Authentication Service using Google OAuth2
 * Handles OAuth flow for Gmail API access
 */
class GmailAuthService {
  private oauth2Client: OAuth2Client | null = null
  private authWindow: BrowserWindow | null = null
  private initialized = false

  // Google OAuth configuration
  private readonly REDIRECT_URI = 'http://localhost:3000/oauth2callback'

  // Gmail API scopes
  private readonly SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
  ]

  /**
   * Initialize OAuth2 client (lazy initialization)
   */
  private initializeOAuth(): void {
    if (this.initialized) return

    const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ''
    const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || ''

    if (!CLIENT_ID || !CLIENT_SECRET) {
      log.warn('Google OAuth credentials not configured')
      return
    }

    this.oauth2Client = new google.auth.OAuth2(
      CLIENT_ID,
      CLIENT_SECRET,
      this.REDIRECT_URI
    )

    this.initialized = true
    log.info('Google OAuth initialized')
  }

  /**
   * Initiate OAuth login flow
   */
  async login(): Promise<{ email: string; name: string }> {
    this.initializeOAuth()

    if (!this.oauth2Client) {
      throw new Error('OAuth not initialized. Please configure Google credentials in .env')
    }

    try {
      // Try to use existing tokens
      const tokens = await storageService.getMicrosoftTokens() // Reusing storage
      if (tokens) {
        this.oauth2Client.setCredentials(JSON.parse(tokens))

        // Verify tokens are still valid
        try {
          const userInfo = await this.getUserInfo()
          log.info('Using existing valid tokens')
          return userInfo
        } catch (error) {
          log.info('Existing tokens invalid, starting new login flow')
        }
      }

      // Start new OAuth flow
      const userInfo = await this.startOAuthFlow()
      return userInfo
    } catch (error: any) {
      log.error('Login failed:', error.message)
      throw error
    }
  }

  /**
   * Start OAuth flow with local server
   */
  private async startOAuthFlow(): Promise<{ email: string; name: string }> {
    return new Promise((resolve, reject) => {
      const authUrl = this.oauth2Client!.generateAuthUrl({
        access_type: 'offline',
        scope: this.SCOPES,
        prompt: 'consent'
      })

      // Create local server to receive callback
      const server = createServer(async (req, res) => {
        if (req.url?.startsWith('/oauth2callback')) {
          const url = new URL(req.url, `http://localhost:3000`)
          const code = url.searchParams.get('code')

          if (code) {
            res.writeHead(200, { 'Content-Type': 'text/html' })
            res.end(`
              <html>
                <body style="font-family: Arial; text-align: center; padding: 50px; background: #1e293b; color: #f1f5f9;">
                  <h1 style="color: #60a5fa;">✓ Success!</h1>
                  <p>You've successfully signed in to Gmail.</p>
                  <p>You can close this window and return to the app.</p>
                  <script>setTimeout(() => window.close(), 2000)</script>
                </body>
              </html>
            `)

            server.close()

            try {
              // Exchange code for tokens
              const { tokens } = await this.oauth2Client!.getToken(code)
              this.oauth2Client!.setCredentials(tokens)

              // Store tokens securely
              await storageService.setMicrosoftTokens(JSON.stringify(tokens))

              // Get user info
              const userInfo = await this.getUserInfo()

              if (this.authWindow && !this.authWindow.isDestroyed()) {
                this.authWindow.close()
              }

              resolve(userInfo)
            } catch (error: any) {
              reject(error)
            }
          } else {
            res.writeHead(400)
            res.end('No code received')
            server.close()
            reject(new Error('No authorization code received'))
          }
        }
      }).listen(3000)

      // Open browser for authentication
      shell.openExternal(authUrl)

      // Show instructions window
      this.showAuthWindow()

      // Timeout after 5 minutes
      setTimeout(() => {
        server.close()
        if (this.authWindow && !this.authWindow.isDestroyed()) {
          this.authWindow.close()
        }
        reject(new Error('Authentication timeout'))
      }, 5 * 60 * 1000)
    })
  }

  /**
   * Show authentication instructions window
   */
  private showAuthWindow(): void {
    this.authWindow = new BrowserWindow({
      width: 500,
      height: 400,
      title: 'Sign in with Google',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    })

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Sign in with Google</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
              background: #1e293b;
              color: #f1f5f9;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              padding: 20px;
            }
            .container {
              text-align: center;
              max-width: 400px;
            }
            h1 {
              color: #60a5fa;
              margin-bottom: 20px;
            }
            p {
              color: #cbd5e1;
              line-height: 1.6;
            }
            .icon {
              font-size: 64px;
              margin-bottom: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">🔐</div>
            <h1>Sign in with Google</h1>
            <p>A browser window has been opened for you to sign in with your Google account.</p>
            <p style="margin-top: 30px; font-size: 14px;">
              After signing in and authorizing the app, this window will close automatically.
            </p>
          </div>
        </body>
      </html>
    `

    this.authWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
  }

  /**
   * Get user info from Google
   */
  async getUserInfo(): Promise<{ email: string; name: string }> {
    this.initializeOAuth()

    if (!this.oauth2Client) {
      throw new Error('OAuth not initialized')
    }

    const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client })
    const { data } = await oauth2.userinfo.get()

    return {
      email: data.email || '',
      name: data.name || data.email || 'User'
    }
  }

  /**
   * Get OAuth2 client (for Gmail API)
   */
  getAuthClient(): OAuth2Client {
    this.initializeOAuth()

    if (!this.oauth2Client) {
      throw new Error('OAuth not initialized')
    }
    return this.oauth2Client
  }

  /**
   * Logout and clear tokens
   */
  async logout(): Promise<void> {
    try {
      await storageService.deleteMicrosoftTokens()

      if (this.oauth2Client) {
        this.oauth2Client.revokeCredentials()
        this.oauth2Client.setCredentials({})
      }

      log.info('Logout successful')
    } catch (error: any) {
      log.error('Logout failed:', error.message)
      throw error
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    this.initializeOAuth()

    if (!this.oauth2Client) return false

    try {
      const tokens = await storageService.getMicrosoftTokens()
      if (!tokens) return false

      this.oauth2Client.setCredentials(JSON.parse(tokens))

      // Try to get user info to verify tokens work
      await this.getUserInfo()
      return true
    } catch {
      return false
    }
  }
}

export const gmailAuthService = new GmailAuthService()
