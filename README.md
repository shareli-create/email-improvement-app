# Email Improvement App

AI-powered desktop application for improving email communication using Claude API and Microsoft 365 integration.

## Features

### Phase 1 (Current)
- ✅ Secure Claude API key storage
- ✅ AI-powered email draft improvement
- ✅ Email tone analysis
- ✅ Modern React UI with Tailwind CSS
- ✅ Electron security hardening

### Planned Features
- 📧 Microsoft 365 OAuth authentication
- 📨 Email inbox and drafts viewing
- 🤖 AI response generation
- 📝 Template management
- 🔄 Background email sync

## Prerequisites

- Node.js 18+ and npm
- Claude API key ([Get one here](https://console.anthropic.com/settings/keys))
- Microsoft 365 account (for Phase 2)

## Installation

1. Clone or navigate to the project directory:
```bash
cd C:\Users\shareli\Documents\projects\email-improvement-app
```

2. Install dependencies (already done):
```bash
npm install
```

3. Create a `.env` file (optional, for Microsoft OAuth later):
```bash
cp .env.example .env
```

## Running the App

Start the development server:
```bash
npm run dev
```

This will:
1. Build the Electron main process
2. Build the preload script
3. Start the Vite dev server for the React UI
4. Launch the Electron app

## First-Time Setup

1. **Add Claude API Key**
   - Click the Settings icon (gear) in the sidebar
   - Paste your Claude API key
   - Click "Validate & Save"
   - The key will be securely stored using OS-level encryption

2. **Test AI Features**
   - Click the AI Assistant icon (sparkles) to open the AI panel
   - Paste an email draft in the text area
   - Click "Improve Draft" to get AI suggestions
   - Or click "Analyze Tone" to get tone analysis

## Project Structure

```
email-improvement-app/
├── src/
│   ├── main/                      # Electron main process
│   │   ├── index.ts               # App entry point
│   │   ├── preload.ts             # Secure IPC bridge
│   │   ├── services/              # Business logic
│   │   │   ├── storage-service.ts # Secure credential storage
│   │   │   └── claude-service.ts  # Claude API client
│   │   └── ipc/                   # IPC handlers
│   │       ├── settings-handler.ts
│   │       ├── ai-handler.ts
│   │       ├── auth-handler.ts    # (Stub)
│   │       ├── email-handler.ts   # (Stub)
│   │       └── template-handler.ts # (Stub)
│   ├── renderer/                  # React UI
│   │   ├── App.tsx                # Main app component
│   │   ├── components/            # React components
│   │   │   ├── Settings.tsx
│   │   │   ├── EmailList.tsx
│   │   │   ├── ReadingPane.tsx
│   │   │   └── AISuggestionsPanel.tsx
│   │   └── styles/                # CSS
│   └── shared/                    # Shared types
│       └── types/
│           └── ipc.ts             # TypeScript interfaces
├── package.json
├── electron.vite.config.ts
├── tsconfig.json
└── tailwind.config.js
```

## Security Features

- **Node Integration**: Disabled
- **Context Isolation**: Enabled
- **Sandbox**: Enabled
- **Credential Storage**: OS-level encryption (Keychain/DPAPI)
- **IPC**: Type-safe contextBridge
- **CSP**: Content Security Policy headers

## Technology Stack

- **Electron**: 40+ (Desktop framework)
- **React**: 19 (UI)
- **TypeScript**: 5 (Type safety)
- **Vite**: 7 (Build tool)
- **Tailwind CSS**: 4 (Styling)
- **Claude API**: Anthropic SDK
- **React Query**: Data fetching
- **electron-store**: Settings persistence
- **electron-log**: Logging

## Building for Production

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

## Development Notes

### Current Implementation (Phase 1)
- Main process with secure IPC
- Claude API integration with streaming
- Settings UI for API key management
- AI panel for draft improvement and tone analysis
- Placeholder components for email features

### Next Steps (Phase 2)
1. Implement Microsoft 365 OAuth (MSAL Node)
2. Add Microsoft Graph API service
3. Create SQLite email cache
4. Build email list and reading pane
5. Implement email sync

### Known Issues
- Microsoft auth not yet implemented (stub only)
- Email features are placeholders
- Templates feature not implemented
- No offline mode yet

## Troubleshooting

### "Encryption not available" error
- Ensure you're running on a supported OS (Windows, macOS, Linux)
- Try restarting the app

### "Invalid API key" error
- Verify your Claude API key starts with `sk-ant-`
- Check the key is active in Anthropic Console
- Ensure you have API credits available

### App won't start
- Check logs in `~/.config/email-improvement-app/logs/`
- Try deleting `node_modules` and running `npm install` again

## License

MIT

## Support

For issues or questions, please refer to the implementation plan at:
`C:\Users\shareli\.claude\plans\glistening-sparking-crystal.md`
