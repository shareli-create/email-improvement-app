import { Mail } from 'lucide-react'
import { useState, useEffect } from 'react'

interface ReadingPaneProps {
  emailId: string | null
}

export function ReadingPane({ emailId }: ReadingPaneProps) {
  const [email, setEmail] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!emailId) {
      setEmail(null)
      return
    }

    const fetchEmail = async () => {
      try {
        setLoading(true)
        const result = await window.electronAPI.emails.getEmail(emailId)
        setEmail(result)
      } catch (error) {
        console.error('Failed to fetch email:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchEmail()
  }, [emailId])

  if (!emailId) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8">
        <Mail size={64} className="mb-4 opacity-30" />
        <p>Select an email to read</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8">
        <Mail size={64} className="mb-4 opacity-30 animate-pulse" />
        <p>Loading email...</p>
      </div>
    )
  }

  if (!email) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8">
        <Mail size={64} className="mb-4 opacity-30" />
        <p>Email not found</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-slate-900">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-2xl font-semibold mb-2">{email.subject}</h1>
        <div className="flex items-center gap-4 text-sm text-slate-400">
          <span>From: {email.from?.name || email.from?.email || 'Unknown'}</span>
          <span>•</span>
          <span>
            {email.receivedDateTime
              ? new Date(email.receivedDateTime).toLocaleString()
              : 'Unknown date'}
          </span>
        </div>
        {email.to && email.to.length > 0 && (
          <div className="mt-2 text-sm text-slate-400">
            To: {email.to.map((t: any) => t.name || t.email).join(', ')}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="prose prose-invert max-w-none">
          <pre className="text-slate-300 whitespace-pre-wrap font-sans">
            {email.body || email.bodyPreview || 'No content available'}
          </pre>
        </div>
      </div>
    </div>
  )
}
