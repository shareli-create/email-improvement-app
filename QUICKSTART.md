# Quick Start Guide

## 🚀 Running the App

The app is currently running! If you closed it, restart with:

```bash
cd C:\Users\shareli\Documents\projects\email-improvement-app
npm run dev
```

## 📝 First-Time Setup

1. **The app should now be open on your screen**
   - You'll see a dark-themed window with a sidebar on the left

2. **Add Your Claude API Key**
   - You should already be on the Settings screen (gear icon)
   - Get your API key from: https://console.anthropic.com/settings/keys
   - Paste it into the "Claude API Key" field
   - Click "Validate & Save"
   - You'll see a green checkmark if successful ✓

3. **Test AI Features**
   - Click the sparkle icon (✨) in the bottom-left sidebar to open AI Assistant
   - Paste an email draft in the text area, for example:
     ```
     hey john, hope your doing well. wanted to touch base about the project
     we discussed last week. can you send me an update when you get a chance?
     thanks
     ```
   - Click "Improve Draft" to see AI suggestions stream in
   - Or click "Analyze Tone" to get a tone report

## 🎯 What Works Right Now

- ✅ **Settings Management**: Secure API key storage
- ✅ **Draft Improvement**: Paste any email draft and get AI-powered improvements
- ✅ **Tone Analysis**: Get detailed feedback on your email's tone and professionalism
- ✅ **Streaming Responses**: See AI suggestions appear in real-time

## 🔜 Coming Next (Phase 2)

- 📧 Microsoft 365 email integration
- 📨 View your actual inbox and drafts
- 🤖 Generate responses to incoming emails
- 📝 Template management

## 🛠️ Troubleshooting

### App won't start
```bash
# Make sure you're in the right directory
cd C:\Users\shareli\Documents\projects\email-improvement-app

# Try running dev again
npm run dev
```

### "Invalid API key" error
- Make sure your key starts with `sk-ant-`
- Check that you have API credits in your Anthropic account
- Verify the key is active in the Anthropic Console

### Want to stop the app?
- Just close the Electron window
- Or press Ctrl+C in the terminal where you ran `npm run dev`

## 💡 Tips

- The AI suggestions work best with complete sentences
- Try different email styles to see how the AI adapts
- Your API key is stored securely using Windows DPAPI encryption
- All AI processing happens through your own Claude API key

## 📚 More Information

See the full README.md for detailed documentation and development info.
