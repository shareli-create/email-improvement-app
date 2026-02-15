import { PublicClientApplication, Configuration, AuthenticationResult } from '@azure/msal-node'
import { BrowserWindow } from 'electron'
import log from 'electron-log'
import { storageService } from './storage-service'

/**
 * Microsoft 365 Authentication Service using MSAL
 * Handles OAuth flow for Microsoft Graph API access
 */
class AuthService {
  private pca: PublicClientApplication | null = null
  private authWindow: BrowserWindow | null = null
  private currentAccount: AuthenticationResult | null = null

  // Azure AD application configuration
  private readonly CLIENT_ID = process.env.VITE_MICROSOFT_CLIENT_ID || ''
  private readonly TENANT_ID = process.env.VITE_MICROSOFT_TENANT_ID || 'common'
  private readonly REDIRECT_URI = 'http://localhost:3000/auth/callback'

  // Microsoft Graph API scopes
  private readonly SCOPES = [
    'User.Read',
    'Mail.Read',
    'Mail.ReadWrite',
    'Mail.Send',
    'MailboxSettings.Read'
  ]

  constructor() {
    this.initializeMSAL()
  }

  /**
   * Initialize MSAL Public Client Application
   */
  private initializeMSAL(): void {
    if (!this.CLIENT_ID) {
      log.warn('Microsoft Client ID not configured')
      return
    }

    const msalConfig: Configuration = {
      auth: {
        clientId: this.CLIENT_ID,
        authority: `https://login.microsoftonline.com/${this.TENANT_ID}`,
        redirectUri: this.REDIRECT_URI
      },
      cache: {
        cachePlugin: {
          beforeCacheAccess: async (cacheContext) => {
            const cachedTokens = await storageService.getMicrosoftTokens()
            if (cachedTokens) {
              cacheContext.tokenCache.deserialize(cachedTokens)
            }
          },
          afterCacheAccess: async (cacheContext) => {
            if (cacheContext.cacheHasChanged) {
              const serialized = cacheContext.tokenCache.serialize()
              await storageService.setMicrosoftTokens(serialized)
            }
          }
        }
      },
      system: {
        loggerOptions: {
          loggerCallback: (level, message) => {
            log.info(`MSAL: ${message}`)
          },
          piiLoggingEnabled: false,
          logLevel: 3 // Info
        }
      }
    }

    this.pca = new PublicClientApplication(msalConfig)
    log.info('MSAL initialized successfully')
  }

  /**
   * Initiate OAuth login flow
   */
  async login(): Promise<AuthenticationResult> {
    if (!this.pca) {
      throw new Error('MSAL not initialized. Please configure VITE_MICROSOFT_CLIENT_ID in .env')
    }

    try {
      // Try silent login first (if tokens exist)
      const account = await this.getSilentAccount()
      if (account) {
        log.info('Silent login successful')
        return account
      }

      // Interactive login required
      log.info('Starting interactive login...')
      const authResult = await this.interactiveLogin()

      this.currentAccount = authResult
      log.info(`Login successful for user: ${authResult.account?.username}`)

      return authResult
    } catch (error: any) {
      log.error('Login failed:', error.message)
      throw error
    }
  }

  /**
   * Attempt silent authentication using cached tokens
   */
  private async getSilentAccount(): Promise<AuthenticationResult | null> {
    if (!this.pca) return null

    try {
      const accounts = await this.pca.getAllAccounts()
      if (accounts.length === 0) {
        return null
      }

      const silentRequest = {
        account: accounts[0],
        scopes: this.SCOPES
      }

      const result = await this.pca.acquireTokenSilent(silentRequest)
      this.currentAccount = result
      return result
    } catch (error) {
      log.info('Silent token acquisition failed, interactive login required')
      return null
    }
  }

  /**
   * Interactive login using device code flow (better for desktop apps)
   */
  private async interactiveLogin(): Promise<AuthenticationResult> {
    if (!this.pca) {
      throw new Error('MSAL not initialized')
    }

    return new Promise((resolve, reject) => {
      const deviceCodeRequest = {
        deviceCodeCallback: (response: any) => {
          // Display the user code to the user
          log.info(`
============================================
To sign in, use a web browser to open the page:
${response.verificationUri}

And enter the code: ${response.userCode}
============================================
          `)

          // Create a window to show instructions
          this.showDeviceCodeWindow(response.userCode, response.verificationUri)
        },
        scopes: this.SCOPES
      }

      this.pca!
        .acquireTokenByDeviceCode(deviceCodeRequest)
        .then((response) => {
          if (this.authWindow && !this.authWindow.isDestroyed()) {
            this.authWindow.close()
          }
          resolve(response)
        })
        .catch((error) => {
          if (this.authWindow && !this.authWindow.isDestroyed()) {
            this.authWindow.close()
          }
          reject(error)
        })
    })
  }

  /**
   * Show a window with device code instructions
   */
  private showDeviceCodeWindow(userCode: string, verificationUri: string): void {
    this.authWindow = new BrowserWindow({
      width: 500,
      height: 400,
      title: 'Microsoft 365 Sign In',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    })

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Sign In to Microsoft 365</title>
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
            .code {
              font-size: 32px;
              font-weight: bold;
              color: #fbbf24;
              background: #334155;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              letter-spacing: 4px;
            }
            .button {
              background: #2563eb;
              color: white;
              padding: 12px 24px;
              border: none;
              border-radius: 6px;
              font-size: 16px;
              cursor: pointer;
              text-decoration: none;
              display: inline-block;
              margin-top: 20px;
            }
            .button:hover {
              background: #1d4ed8;
            }
            p {
              color: #cbd5e1;
              line-height: 1.6;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Sign in to Microsoft 365</h1>
            <p>1. Click the button below to open Microsoft login</p>
            <a href="${verificationUri}" class="button" target="_blank">Open Microsoft Login</a>
            <p>2. Enter this code when prompted:</p>
            <div class="code">${userCode}</div>
            <p style="font-size: 12px; margin-top: 30px;">
              This window will close automatically after you sign in.
            </p>
          </div>
          <script>
            // Auto-open the browser
            window.addEventListener('DOMContentLoaded', () => {
              setTimeout(() => {
                window.open('${verificationUri}', '_blank');
              }, 1000);
            });
          </script>
        </body>
      </html>
    `

    this.authWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
  }

  /**
   * Get access token for Microsoft Graph API
   */
  async getAccessToken(): Promise<string> {
    if (!this.pca) {
      throw new Error('MSAL not initialized')
    }

    try {
      // Try to get token silently
      const accounts = await this.pca.getAllAccounts()
      if (accounts.length === 0) {
        throw new Error('No authenticated account. Please login first.')
      }

      const result = await this.pca.acquireTokenSilent({
        account: accounts[0],
        scopes: this.SCOPES
      })

      return result.accessToken
    } catch (error: any) {
      log.error('Failed to get access token:', error.message)
      throw error
    }
  }

  /**
   * Logout and clear tokens
   */
  async logout(): Promise<void> {
    try {
      await storageService.deleteMicrosoftTokens()
      this.currentAccount = null

      if (this.pca) {
        const accounts = await this.pca.getAllAccounts()
        for (const account of accounts) {
          await this.pca.getTokenCache().removeAccount(account)
        }
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
    if (!this.pca) return false

    try {
      const accounts = await this.pca.getAllAccounts()
      return accounts.length > 0
    } catch {
      return false
    }
  }

  /**
   * Get current user info
   */
  async getUserInfo(): Promise<{ email: string; name: string } | null> {
    if (!this.pca) return null

    try {
      const accounts = await this.pca.getAllAccounts()
      if (accounts.length === 0) return null

      const account = accounts[0]
      return {
        email: account.username,
        name: account.name || account.username
      }
    } catch {
      return null
    }
  }
}

export const authService = new AuthService()
