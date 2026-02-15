import { RefreshCw, Inbox } from 'lucide-react'
import { useState, useEffect } from 'react'

interface EmailListProps {
  selectedEmailId: string | null
  onSelectEmail: (id: string) => void
}

export function EmailList({ selectedEmailId, onSelectEmail }: EmailListProps) {
  const [emails, setEmails] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchEmails = async () => {
    try {
      setLoading(true)
      console.log('Fetching emails from API...')
      const result = await window.electronAPI.emails.fetchInbox(50)
      console.log('Received emails:', result)
      console.log('Email count:', result?.length)
      console.log('First email:', result?.[0])
      setEmails(result)
    } catch (error) {
      console.error('Failed to fetch emails:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEmails()
  }, [])

  return (
    <div className="h-full flex flex-col bg-slate-900">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Inbox size={20} />
            Inbox
          </h2>
          <button
            onClick={fetchEmails}
            disabled={loading}
            className="p-2 hover:bg-slate-800 rounded transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Email List */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8">
            <RefreshCw size={48} className="mb-4 opacity-50 animate-spin" />
            <p className="text-sm">Loading emails...</p>
          </div>
        ) : emails.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center">
            <Inbox size={48} className="mb-4 opacity-50" />
            <p className="text-sm">No emails yet</p>
            <p className="text-xs mt-2">
              Connect your Gmail account in Settings to view your emails
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {emails.map((email) => (
              <div
                key={email.id}
                onClick={() => onSelectEmail(email.id)}
                className={`p-4 cursor-pointer transition-colors ${
                  selectedEmailId === email.id
                    ? 'bg-blue-900/30 border-l-2 border-blue-500'
                    : 'hover:bg-slate-800/50'
                }`}
              >
                <div className="font-medium text-sm mb-1">
                  {email.from?.name || email.from?.email || 'Unknown'}
                </div>
                <div className="text-sm text-slate-100 mb-1 truncate">{email.subject}</div>
                <div className="text-xs text-slate-400 truncate">{email.bodyPreview}</div>
                <div className="text-xs text-slate-500 mt-1">
                  {email.receivedDateTime ? new Date(email.receivedDateTime).toLocaleDateString() : ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
