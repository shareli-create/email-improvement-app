import { useState } from 'react'
import { Settings } from './components/Settings'
import { EmailList } from './components/EmailList'
import { ReadingPane } from './components/ReadingPane'
import { AISuggestionsPanel } from './components/AISuggestionsPanel'
import { Settings as SettingsIcon, Mail, Sparkles } from 'lucide-react'

type View = 'emails' | 'settings'

function App() {
  const [currentView, setCurrentView] = useState<View>('settings') // Start with settings to configure API key
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null)
  const [showAIPanel, setShowAIPanel] = useState(false)

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100">
      {/* Sidebar */}
      <div className="w-16 bg-slate-950 border-r border-slate-800 flex flex-col items-center py-4 gap-4">
        <button
          onClick={() => setCurrentView('emails')}
          className={`p-3 rounded-lg transition-colors ${
            currentView === 'emails'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
          }`}
          title="Emails"
        >
          <Mail size={24} />
        </button>

        <button
          onClick={() => setCurrentView('settings')}
          className={`p-3 rounded-lg transition-colors ${
            currentView === 'settings'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
          }`}
          title="Settings"
        >
          <SettingsIcon size={24} />
        </button>

        <div className="flex-1" />

        <button
          onClick={() => setShowAIPanel(!showAIPanel)}
          className={`p-3 rounded-lg transition-colors ${
            showAIPanel
              ? 'bg-purple-600 text-white'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
          }`}
          title="AI Assistant"
        >
          <Sparkles size={24} />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {currentView === 'settings' ? (
          <div className="flex-1 overflow-auto p-8">
            <Settings />
          </div>
        ) : (
          <>
            {/* Email List */}
            <div className="w-80 border-r border-slate-800">
              <EmailList
                selectedEmailId={selectedEmailId}
                onSelectEmail={setSelectedEmailId}
              />
            </div>

            {/* Reading Pane */}
            <div className={`flex-1 ${showAIPanel ? 'border-r border-slate-800' : ''}`}>
              <ReadingPane emailId={selectedEmailId} />
            </div>

            {/* AI Suggestions Panel */}
            {showAIPanel && (
              <div className="w-96">
                <AISuggestionsPanel />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default App
