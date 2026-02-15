import { contextBridge, ipcRenderer } from 'electron'
import type { ElectronAPI } from '../shared/types/ipc'

// Expose protected methods that allow the renderer process to use ipcRenderer
// without exposing the entire object
const electronAPI: ElectronAPI = {
  auth: {
    login: () => ipcRenderer.invoke('auth:login'),
    logout: () => ipcRenderer.invoke('auth:logout'),
    getStatus: () => ipcRenderer.invoke('auth:get-status')
  },

  settings: {
    setClaudeApiKey: (key: string) => ipcRenderer.invoke('settings:set-claude-key', key),
    getClaudeApiKey: () => ipcRenderer.invoke('settings:get-claude-key'),
    validateClaudeApiKey: (key: string) => ipcRenderer.invoke('settings:validate-claude-key', key)
  },

  emails: {
    fetchInbox: (limit?: number) => ipcRenderer.invoke('emails:fetch-inbox', limit),
    getEmail: (id: string) => ipcRenderer.invoke('emails:get', id),
    getDrafts: () => ipcRenderer.invoke('emails:get-drafts'),
    sync: () => ipcRenderer.invoke('emails:sync'),
    sendReply: (emailId: string, body: string, subject: string) =>
      ipcRenderer.invoke('emails:send-reply', emailId, body, subject)
  },

  ai: {
    improveDraft: (content: string, subject?: string) =>
      ipcRenderer.invoke('ai:improve-draft', content, subject),
    generateResponse: (emailId: string, tone: string) =>
      ipcRenderer.invoke('ai:generate-response', emailId, tone),
    analyzeTone: (content: string) => ipcRenderer.invoke('ai:analyze-tone', content),

    // Event listeners for streaming
    onStreamUpdate: (callback: (text: string) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, text: string) => callback(text)
      ipcRenderer.on('ai:stream-update', listener)
      // Return cleanup function
      return () => {
        ipcRenderer.removeListener('ai:stream-update', listener)
      }
    },
    onStreamComplete: (callback: (result: any) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, result: any) => callback(result)
      ipcRenderer.on('ai:stream-complete', listener)
      return () => {
        ipcRenderer.removeListener('ai:stream-complete', listener)
      }
    }
  },

  templates: {
    getAll: () => ipcRenderer.invoke('templates:get-all'),
    create: (template: any) => ipcRenderer.invoke('templates:create', template),
    update: (id: string, template: any) => ipcRenderer.invoke('templates:update', id, template),
    delete: (id: string) => ipcRenderer.invoke('templates:delete', id)
  }
}

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', electronAPI)

// Type declaration for window.electronAPI (will be used in renderer)
declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
