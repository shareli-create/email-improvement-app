import { useState, useEffect } from 'react'
import { Key, CheckCircle, XCircle, Loader, Mail } from 'lucide-react'

export function Settings() {
  const [apiKey, setApiKey] = useState('')
  const [currentKey, setCurrentKey] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<'valid' | 'invalid' | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  // Gmail auth state
  const [isGmailConnected, setIsGmailConnected] = useState(false)
  const [gmailEmail, setGmailEmail] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)

  useEffect(() => {
    // Load existing API key (masked)
    window.electronAPI.settings.getClaudeApiKey().then((key) => {
      if (key) {
        setCurrentKey(key)
      }
    })

    // Check Gmail auth status
    window.electronAPI.auth.getStatus().then((status) => {
      setIsGmailConnected(status.isAuthenticated)
      setGmailEmail(status.userEmail || null)
    })
  }, [])

  const handleValidate = async () => {
    if (!apiKey.trim()) {
      return
    }

    setIsValidating(true)
    setValidationResult(null)

    try {
      const isValid = await window.electronAPI.settings.validateClaudeApiKey(apiKey)
      setValidationResult(isValid ? 'valid' : 'invalid')

      if (isValid) {
        // Automatically save if valid
        await handleSave()
      }
    } catch (error) {
      setValidationResult('invalid')
    } finally {
      setIsValidating(false)
    }
  }

  const handleSave = async () => {
    if (!apiKey.trim()) {
      return
    }

    setIsSaving(true)
    setSaveMessage(null)

    try {
      await window.electronAPI.settings.setClaudeApiKey(apiKey)
      setSaveMessage('API key saved successfully!')
      setApiKey('') // Clear input
      // Refresh current key display
      const maskedKey = await window.electronAPI.settings.getClaudeApiKey()
      setCurrentKey(maskedKey)
    } catch (error: any) {
      setSaveMessage(`Error: ${error.message}`)
    } finally {
      setIsSaving(false)
      setTimeout(() => setSaveMessage(null), 3000)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Settings</h1>
      <p className="text-slate-400 mb-8">Configure your email improvement app</p>

      {/* Claude API Key Section */}
      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Key className="text-blue-500" size={24} />
          <h2 className="text-xl font-semibold">Claude API Key</h2>
        </div>

        <p className="text-slate-400 text-sm mb-4">
          Get your API key from{' '}
          <a
            href="https://console.anthropic.com/settings/keys"
            className="text-blue-400 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Anthropic Console
          </a>
        </p>

        {currentKey && (
          <div className="mb-4 p-3 bg-slate-900 rounded border border-slate-700">
            <p className="text-sm text-slate-400">Current API Key:</p>
            <p className="font-mono text-sm">{currentKey}</p>
          </div>
        )}

        <div className="space-y-3">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value)
              setValidationResult(null)
            }}
            placeholder="sk-ant-..."
            className="input font-mono"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleValidate()
              }
            }}
          />

          <div className="flex gap-2">
            <button
              onClick={handleValidate}
              disabled={!apiKey.trim() || isValidating}
              className="btn btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isValidating ? (
                <>
                  <Loader className="animate-spin" size={16} />
                  Validating...
                </>
              ) : (
                'Validate & Save'
              )}
            </button>
          </div>

          {validationResult && (
            <div
              className={`flex items-center gap-2 p-3 rounded ${
                validationResult === 'valid'
                  ? 'bg-green-900/30 text-green-400 border border-green-800'
                  : 'bg-red-900/30 text-red-400 border border-red-800'
              }`}
            >
              {validationResult === 'valid' ? (
                <>
                  <CheckCircle size={20} />
                  <span>API key is valid and has been saved!</span>
                </>
              ) : (
                <>
                  <XCircle size={20} />
                  <span>Invalid API key. Please check and try again.</span>
                </>
              )}
            </div>
          )}

          {saveMessage && (
            <div className="p-3 bg-blue-900/30 text-blue-400 rounded border border-blue-800">
              {saveMessage}
            </div>
          )}
        </div>
      </div>

      {/* Gmail Section */}
      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="text-green-500" size={24} />
          <h2 className="text-xl font-semibold">Gmail Account</h2>
        </div>

        <p className="text-slate-400 text-sm mb-4">
          Connect your Gmail account to access and improve your emails directly.
        </p>

        {isGmailConnected ? (
          <div className="space-y-3">
            <div className="p-3 bg-green-900/30 rounded border border-green-800 flex items-center gap-2 text-green-400">
              <CheckCircle size={20} />
              <span>Connected as: {gmailEmail}</span>
            </div>
            <button
              onClick={async () => {
                await window.electronAPI.auth.logout()
                setIsGmailConnected(false)
                setGmailEmail(null)
              }}
              className="btn btn-danger"
            >
              Disconnect Gmail
            </button>
          </div>
        ) : (
          <button
            onClick={async () => {
              setIsConnecting(true)
              try {
                const status = await window.electronAPI.auth.login()
                setIsGmailConnected(status.isAuthenticated)
                setGmailEmail(status.userEmail || null)
              } catch (error: any) {
                alert(`Failed to connect: ${error.message}`)
              } finally {
                setIsConnecting(false)
              }
            }}
            disabled={isConnecting}
            className="btn btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConnecting ? (
              <>
                <Loader className="animate-spin" size={16} />
                Connecting...
              </>
            ) : (
              <>
                <Mail size={16} />
                Connect Gmail Account
              </>
            )}
          </button>
        )}
      </div>

      {/* Info */}
      <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-4">
        <h3 className="font-semibold text-blue-400 mb-2">Setup Instructions</h3>
        <ol className="text-sm text-slate-300 space-y-1 list-decimal list-inside">
          <li>Add your Claude API key above ✓</li>
          <li>Follow <code className="bg-slate-800 px-1 rounded">GOOGLE_SETUP.md</code> to get Google credentials</li>
          <li>Add credentials to <code className="bg-slate-800 px-1 rounded">.env</code> file</li>
          <li>Restart the app and connect Gmail</li>
          <li>Start improving your emails!</li>
        </ol>
      </div>
    </div>
  )
}
