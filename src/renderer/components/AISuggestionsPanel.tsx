import { useState, useEffect } from 'react'
import { Sparkles, Loader, Mail } from 'lucide-react'

interface AISuggestionsPanelProps {
  emailId: string | null
}

export function AISuggestionsPanel({ emailId }: AISuggestionsPanelProps) {
  const [email, setEmail] = useState<any>(null)
  const [draftText, setDraftText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [aiResponse, setAiResponse] = useState('')

  useEffect(() => {
    // Listen for streaming updates
    const cleanup1 = window.electronAPI.ai.onStreamUpdate((text: string) => {
      setAiResponse((prev) => prev + text)
    })

    const cleanup2 = window.electronAPI.ai.onStreamComplete((result: any) => {
      setIsProcessing(false)
    })

    return () => {
      cleanup1()
      cleanup2()
    }
  }, [])

  useEffect(() => {
    if (!emailId) {
      setEmail(null)
      setAiResponse('')
      return
    }

    const fetchEmail = async () => {
      try {
        const result = await window.electronAPI.emails.getEmail(emailId)
        setEmail(result)
      } catch (error) {
        console.error('Failed to fetch email:', error)
      }
    }

    fetchEmail()
  }, [emailId])

  const handleGenerateResponse = async (tone: string) => {
    if (!emailId) return

    setIsProcessing(true)
    setAiResponse('')

    try {
      await window.electronAPI.ai.generateResponse(emailId, tone)
    } catch (error: any) {
      setAiResponse(`Error: ${error.message}`)
      setIsProcessing(false)
    }
  }

  const handleImproveDraft = async () => {
    if (!draftText.trim()) return

    setIsProcessing(true)
    setAiResponse('')

    try {
      await window.electronAPI.ai.improveDraft(draftText)
    } catch (error: any) {
      setAiResponse(`Error: ${error.message}`)
      setIsProcessing(false)
    }
  }

  const handleAnalyzeTone = async () => {
    if (!draftText.trim()) return

    setIsProcessing(true)
    setAiResponse('')

    try {
      const analysis = await window.electronAPI.ai.analyzeTone(draftText)
      setAiResponse(
        `Tone: ${analysis.overallTone}\n` +
          `Professionalism: ${analysis.professionalismScore}/10\n` +
          `Sentiment: ${analysis.sentiment}\n\n` +
          `Strengths:\n${analysis.strengths.map((s) => `• ${s}`).join('\n')}\n\n` +
          `Improvements:\n${analysis.improvements.map((i) => `• ${i}`).join('\n')}`
      )
    } catch (error: any) {
      setAiResponse(`Error: ${error.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="h-full flex flex-col bg-slate-900">
      <div className="p-4 border-b border-slate-800">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="text-purple-500" size={20} />
          AI Assistant
        </h2>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Email Response Generator */}
        {email && (
          <div className="card bg-slate-800/50">
            <h3 className="font-semibold mb-2 text-blue-400">Generate Response</h3>
            <p className="text-xs text-slate-400 mb-3">
              Reply to: {email.subject}
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleGenerateResponse('formal')}
                disabled={isProcessing}
                className="btn btn-sm btn-secondary disabled:opacity-50"
              >
                Formal
              </button>
              <button
                onClick={() => handleGenerateResponse('friendly')}
                disabled={isProcessing}
                className="btn btn-sm btn-secondary disabled:opacity-50"
              >
                Friendly
              </button>
              <button
                onClick={() => handleGenerateResponse('quick')}
                disabled={isProcessing}
                className="btn btn-sm btn-secondary disabled:opacity-50"
              >
                Quick
              </button>
            </div>
          </div>
        )}

        {/* Draft Input */}
        <div>
          <label className="block text-sm font-medium mb-2">Your Draft</label>
          <textarea
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            placeholder="Paste your email draft here..."
            className="input min-h-[150px] resize-none"
            disabled={isProcessing}
          />
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 gap-2">
          <button
            onClick={handleImproveDraft}
            disabled={!draftText.trim() || isProcessing}
            className="btn btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <Loader className="animate-spin" size={16} />
                Processing...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Improve Draft
              </>
            )}
          </button>

          <button
            onClick={handleAnalyzeTone}
            disabled={!draftText.trim() || isProcessing}
            className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Analyze Tone
          </button>
        </div>

        {/* AI Response */}
        {aiResponse && (
          <div className="card">
            <h3 className="font-semibold mb-2 flex items-center gap-2 text-purple-400">
              <Sparkles size={16} />
              AI Suggestion
            </h3>
            <div className="text-sm text-slate-300 whitespace-pre-wrap">{aiResponse}</div>
          </div>
        )}

        {!email && !draftText && (
          <div className="flex flex-col items-center justify-center text-slate-500 py-12">
            <Mail size={48} className="mb-3 opacity-30" />
            <p className="text-sm">Select an email or paste a draft to get AI assistance</p>
          </div>
        )}
      </div>
    </div>
  )
}
