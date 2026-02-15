# Google Cloud Setup Guide for Gmail Integration

**Much simpler than Azure!** Just 5 minutes to set up.

## Step 1: Go to Google Cloud Console

👉 **https://console.cloud.google.com/**

(Sign in with your Google account - any Gmail account works, free tier is fine)

## Step 2: Create a New Project

1. Click the project dropdown at the top (says "Select a project")
2. Click **"NEW PROJECT"**
3. Project name: `Email Improvement App`
4. Click **"CREATE"**
5. Wait a few seconds for it to create

## Step 3: Enable Gmail API

1. Make sure your new project is selected (check top bar)
2. In the search bar at the top, type: `Gmail API`
3. Click on **"Gmail API"**
4. Click the blue **"ENABLE"** button
5. Wait for it to enable (takes ~10 seconds)

## Step 4: Create OAuth Credentials

1. In the left sidebar, click **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** at the top
3. Select **"OAuth client ID"**

### First Time? Configure Consent Screen:

If prompted to configure consent screen:

1. Click **"CONFIGURE CONSENT SCREEN"**
2. Select **"External"** (allows any Gmail user)
3. Click **"CREATE"**

4. Fill in required fields:
   - **App name:** `Email Improvement App`
   - **User support email:** (your email)
   - **Developer contact:** (your email again)

5. Click **"SAVE AND CONTINUE"**

6. On "Scopes" page, click **"ADD OR REMOVE SCOPES"**
7. Filter/search for and select these:
   - ☑️ `https://www.googleapis.com/auth/gmail.readonly`
   - ☑️ `https://www.googleapis.com/auth/gmail.send`
   - ☑️ `https://www.googleapis.com/auth/gmail.modify`
   - ☑️ `https://www.googleapis.com/auth/userinfo.email`
   - ☑️ `https://www.googleapis.com/auth/userinfo.profile`

8. Click **"UPDATE"** then **"SAVE AND CONTINUE"**

9. On "Test users" page (if shown), click **"ADD USERS"**
10. Add your Gmail address
11. Click **"SAVE AND CONTINUE"**

12. Click **"BACK TO DASHBOARD"**

### Now Create the OAuth Client:

1. Go back to **Credentials** in the left sidebar
2. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
3. **Application type:** Select **"Desktop app"**
4. **Name:** `Email Improvement Desktop`
5. Click **"CREATE"**

## Step 5: Copy Your Credentials

A popup appears with your credentials:

1. **Copy the "Client ID"** - looks like: `123456789-abc.apps.googleusercontent.com`
2. **Copy the "Client secret"** - looks like: `GOCSPX-abcd1234...`

(You can also download the JSON file for backup)

Click **"OK"**

## Step 6: Configure Your App

1. Create `.env` file in your project:
```bash
cp .env.example .env
```

2. Edit `.env` and add your credentials:

```
VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=GOCSPX-your-secret-here
```

Replace with the actual values you copied.

## Step 7: Test It!

1. **Restart the app:**
   ```bash
   npm run dev
   ```

2. **In Settings:**
   - Click "Connect Gmail Account"
   - Your browser opens for Google sign-in
   - Sign in and click "Allow"
   - Browser shows success message
   - Return to app - you're logged in!

3. **Check your emails:**
   - Click the Mail icon
   - Your Gmail inbox should load!

## Troubleshooting

### "Access blocked: This app's request is invalid"

**Solution:** Make sure you added your Gmail address as a test user in the OAuth consent screen.

### "redirect_uri_mismatch"

**Solution:** The redirect URI is hardcoded as `http://localhost:3000/oauth2callback` - this should work automatically for desktop apps.

### "Invalid client"

**Solution:** Double-check your Client ID and Client Secret in `.env` are exactly as shown in Google Cloud Console.

### Can't find Gmail API

**Solution:** Make sure you're in the correct project (check project name in top bar)

## Security Notes

✅ **Keep private (in `.env`, NOT in git):**
- Client Secret

✅ **Safe to share:**
- Client ID (it's in your app anyway)

## Publishing Your App (Optional - Later)

Right now your app is in "Testing" mode - only you (and test users you add) can use it.

To make it public:
1. Go to "OAuth consent screen"
2. Click "PUBLISH APP"
3. Submit for Google verification (if you want others to use it)

**For personal use, keep it in Testing mode - works perfectly!**

## Cost

**100% Free** for personal use:
- Gmail API: Free tier is 1 billion quota units/day
- You'll use ~5-10 units per email
- Even reading 10,000 emails/day = still free

## Need Help?

- Gmail API Docs: https://developers.google.com/gmail/api
- OAuth Desktop Apps: https://developers.google.com/identity/protocols/oauth2/native-app

---

**Next:** Once you have your credentials in `.env`, restart the app and click "Connect Gmail Account" in Settings!
