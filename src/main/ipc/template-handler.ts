import type { IpcMain } from 'electron'
import log from 'electron-log'
import type { Template } from '../../shared/types/ipc'
import { cacheService } from '../services/cache-service'

export function setupTemplateHandlers(ipcMain: IpcMain): void {
  // Get all templates
  ipcMain.handle('templates:get-all', async () => {
    try {
      log.info('Fetching all templates')
      const templates = cacheService.getAllTemplates()
      return templates
    } catch (error: any) {
      log.error('Failed to get templates:', error.message)
      throw error
    }
  })

  // Create template
  ipcMain.handle('templates:create', async (_event, template: any) => {
    try {
      log.info('Creating template:', template.name)
      const newTemplate = cacheService.createTemplate(template)
      return newTemplate
    } catch (error: any) {
      log.error('Failed to create template:', error.message)
      throw error
    }
  })

  // Update template
  ipcMain.handle('templates:update', async (_event, id: string, updates: any) => {
    try {
      log.info('Updating template:', id)
      const updatedTemplate = cacheService.updateTemplate(id, updates)
      return updatedTemplate
    } catch (error: any) {
      log.error('Failed to update template:', error.message)
      throw error
    }
  })

  // Delete template
  ipcMain.handle('templates:delete', async (_event, id: string) => {
    try {
      log.info('Deleting template:', id)
      cacheService.deleteTemplate(id)
      return { success: true }
    } catch (error: any) {
      log.error('Failed to delete template:', error.message)
      throw error
    }
  })

  log.info('Template IPC handlers registered')
}
