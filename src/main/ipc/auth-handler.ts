import type { IpcMain } from 'electron'
import log from 'electron-log'
import type { AuthStatus } from '../../shared/types/ipc'
import { gmailAuthService } from '../services/gmail-auth-service'

export function setupAuthHandlers(ipcMain: IpcMain): void {
  // Login
  ipcMain.handle('auth:login', async () => {
    try {
      log.info('Login requested - Starting Google OAuth flow')

      const userInfo = await gmailAuthService.login()

      const authStatus: AuthStatus = {
        isAuthenticated: true,
        userEmail: userInfo.email,
        userName: userInfo.name
      }

      log.info(`Login successful: ${authStatus.userEmail}`)
      return authStatus
    } catch (error: any) {
      log.error('Login failed:', error.message)
      throw error
    }
  })

  // Logout
  ipcMain.handle('auth:logout', async () => {
    try {
      log.info('Logout requested')
      await gmailAuthService.logout()
      return { success: true }
    } catch (error: any) {
      log.error('Logout failed:', error.message)
      throw error
    }
  })

  // Get auth status
  ipcMain.handle('auth:get-status', async () => {
    try {
      const isAuthenticated = await gmailAuthService.isAuthenticated()
      let userInfo = null

      if (isAuthenticated) {
        try {
          userInfo = await gmailAuthService.getUserInfo()
        } catch (error) {
          log.error('Failed to get user info:', error)
        }
      }

      const authStatus: AuthStatus = {
        isAuthenticated,
        userEmail: userInfo?.email,
        userName: userInfo?.name
      }

      return authStatus
    } catch (error: any) {
      log.error('Get status failed:', error.message)
      throw error
    }
  })

  log.info('Auth IPC handlers registered')
}
