import { Mail } from 'lucide-react'

interface ReadingPaneProps {
  emailId: string | null
}

export function ReadingPane({ emailId }: ReadingPaneProps) {
  if (!emailId) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8">
        <Mail size={64} className="mb-4 opacity-30" />
        <p>Select an email to read</p>
      </div>
    )
  }

  // Placeholder - will load email content in Phase 2
  return (
    <div className="h-full flex flex-col bg-slate-900">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-2xl font-semibold mb-2">Email Subject</h1>
        <div className="flex items-center gap-4 text-sm text-slate-400">
          <span>From: sender@example.com</span>
          <span>•</span>
          <span>Today at 10:30 AM</span>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="prose prose-invert max-w-none">
          <p className="text-slate-300">Email content will appear here...</p>
        </div>
      </div>
    </div>
  )
}
