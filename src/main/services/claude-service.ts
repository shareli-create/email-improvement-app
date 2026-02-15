import Anthropic from '@anthropic-ai/sdk'
import type { BrowserWindow } from 'electron'
import log from 'electron-log'
import { storageService } from './storage-service'
import type { ToneAnalysis, ResponseTone, AIResult } from '../../shared/types/ipc'

// Prompt templates
const IMPROVE_DRAFT_PROMPT = `You are an expert email communication assistant. Improve the following email draft to be more professional, clear, and effective.

{subject_context}Original Email:
<email>
{content}
</email>

Please provide:
1. An improved version of the email
2. 2-3 specific improvements you made
3. Alternative subject line suggestions (if subject was provided)

Maintain the original intent and key points, but enhance clarity, tone, and professionalism.`

const GENERATE_RESPONSE_PROMPT = `Generate a professional email response to the email below.

Original Email:
<email>
{content}
</email>

Response Type: {tone}

Generate an appropriate response that:
1. Addresses the key points from the original email
2. Matches the requested tone ({tone})
3. Is professional and clear
4. Maintains appropriate length for the tone type`

const TONE_ANALYSIS_PROMPT = `Analyze the tone and professionalism of this email:

<email>
{content}
</email>

Provide your analysis in the following JSON format only, with no additional text:
{
  "overallTone": "brief description (e.g., formal, casual, urgent)",
  "professionalismScore": number from 1-10,
  "sentiment": "positive" or "negative" or "neutral",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["improvement 1", "improvement 2", "improvement 3"]
}`

/**
 * Claude AI Service
 * Handles all Claude API interactions with streaming support
 */
class ClaudeService {
  private client: Anthropic | null = null

  constructor() {
    log.info('Claude service initialized')
  }

  /**
   * Initialize Claude client with API key
   */
  private async initClient(): Promise<Anthropic> {
    if (this.client) {
      return this.client
    }

    const apiKey = await storageService.getClaudeApiKey()
    if (!apiKey) {
      throw new Error('Claude API key not configured. Please add your API key in Settings.')
    }

    this.client = new Anthropic({ apiKey })
    return this.client
  }

  /**
   * Validate API key by making a test request
   */
  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const testClient = new Anthropic({ apiKey })
      const response = await testClient.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }]
      })
      return response.content.length > 0
    } catch (error: any) {
      log.error('API key validation failed:', error.message)
      return false
    }
  }

  /**
   * Improve email draft with streaming
   */
  async improveDraft(
    content: string,
    subject: string | undefined,
    mainWindow: BrowserWindow
  ): Promise<void> {
    try {
      const client = await this.initClient()

      const subjectContext = subject ? `Subject: ${subject}\n\n` : ''
      const prompt = IMPROVE_DRAFT_PROMPT.replace('{content}', content).replace(
        '{subject_context}',
        subjectContext
      )

      log.info('Starting draft improvement...')

      const stream = await client.messages.stream({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }]
      })

      let fullResponse = ''

      stream.on('text', (text) => {
        fullResponse += text
        mainWindow.webContents.send('ai:stream-update', text)
      })

      const finalMessage = await stream.finalMessage()
      log.info('Draft improvement complete')

      const result: AIResult = {
        type: 'improvement',
        content: fullResponse
      }

      mainWindow.webContents.send('ai:stream-complete', result)
    } catch (error: any) {
      log.error('Failed to improve draft:', error.message)
      throw error
    }
  }

  /**
   * Generate email response with streaming
   */
  async generateResponse(
    emailContent: string,
    tone: ResponseTone,
    mainWindow: BrowserWindow
  ): Promise<void> {
    try {
      const client = await this.initClient()

      const prompt = GENERATE_RESPONSE_PROMPT.replace('{content}', emailContent).replace(
        /{tone}/g,
        tone
      )

      log.info(`Generating ${tone} response...`)

      const stream = await client.messages.stream({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }]
      })

      let fullResponse = ''

      stream.on('text', (text) => {
        fullResponse += text
        mainWindow.webContents.send('ai:stream-update', text)
      })

      await stream.finalMessage()
      log.info('Response generation complete')

      const result: AIResult = {
        type: 'response',
        content: fullResponse
      }

      mainWindow.webContents.send('ai:stream-complete', result)
    } catch (error: any) {
      log.error('Failed to generate response:', error.message)
      throw error
    }
  }

  /**
   * Analyze email tone (non-streaming, returns JSON)
   */
  async analyzeTone(content: string): Promise<ToneAnalysis> {
    try {
      const client = await this.initClient()

      const prompt = TONE_ANALYSIS_PROMPT.replace('{content}', content)

      log.info('Analyzing tone...')

      const response = await client.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 800,
        messages: [{ role: 'user', content: prompt }]
      })

      const textContent = response.content[0]
      if (textContent.type !== 'text') {
        throw new Error('Unexpected response format')
      }

      // Parse JSON response
      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('Could not parse tone analysis response')
      }

      const analysis: ToneAnalysis = JSON.parse(jsonMatch[0])
      log.info('Tone analysis complete')

      return analysis
    } catch (error: any) {
      log.error('Failed to analyze tone:', error.message)
      throw error
    }
  }

  /**
   * Reset client (for key changes)
   */
  reset(): void {
    this.client = null
    log.info('Claude client reset')
  }
}

export const claudeService = new ClaudeService()
