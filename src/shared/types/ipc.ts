// IPC channel definitions for type-safe communication between main and renderer processes

export interface ElectronAPI {
  auth: {
    login: () => Promise<AuthStatus>
    logout: () => Promise<void>
    getStatus: () => Promise<AuthStatus>
  }

  settings: {
    setClaudeApiKey: (key: string) => Promise<void>
    getClaudeApiKey: () => Promise<string | null>
    validateClaudeApiKey: (key: string) => Promise<boolean>
  }

  emails: {
    fetchInbox: (limit?: number) => Promise<Email[]>
    getEmail: (id: string) => Promise<Email | null>
    getDrafts: () => Promise<Email[]>
    sync: () => Promise<void>
  }

  ai: {
    improveDraft: (content: string, subject?: string) => Promise<void>
    generateResponse: (emailId: string, tone: ResponseTone) => Promise<void>
    analyzeTone: (content: string) => Promise<ToneAnalysis>
    onStreamUpdate: (callback: (text: string) => void) => () => void
    onStreamComplete: (callback: (result: AIResult) => void) => () => void
  }

  templates: {
    getAll: () => Promise<Template[]>
    create: (template: Omit<Template, 'id' | 'createdAt'>) => Promise<Template>
    update: (id: string, template: Partial<Template>) => Promise<Template>
    delete: (id: string) => Promise<void>
  }
}

export interface AuthStatus {
  isAuthenticated: boolean
  userEmail?: string
  userName?: string
}

export interface Email {
  id: string
  subject: string
  from: {
    name: string
    email: string
  }
  to: Array<{ name: string; email: string }>
  body: string
  bodyPreview: string
  receivedDateTime: string
  isDraft: boolean
  conversationId?: string
}

export type ResponseTone = 'quick' | 'detailed' | 'formal' | 'friendly'

export interface ToneAnalysis {
  overallTone: string
  professionalismScore: number
  sentiment: 'positive' | 'negative' | 'neutral'
  strengths: string[]
  improvements: string[]
}

export interface AIResult {
  type: 'improvement' | 'response' | 'tone'
  content?: string
  improvements?: string[]
  alternativeSubjects?: string[]
  toneAnalysis?: ToneAnalysis
}

export interface Template {
  id: string
  name: string
  subject: string
  body: string
  category?: string
  variables: string[] // e.g., ['name', 'company', 'date']
  createdAt: string
  updatedAt: string
}
