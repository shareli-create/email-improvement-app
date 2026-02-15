# Azure AD App Registration Guide

To use Microsoft 365 email integration, you need to register an application in Azure Active Directory.

## Prerequisites

- A Microsoft account (personal or work/school)
- Access to Azure Portal (free tier works fine)

## Step-by-Step Instructions

### 1. Go to Azure Portal

Visit: https://portal.azure.com/

### 2. Navigate to App Registrations

1. In the left sidebar, click **"Azure Active Directory"**
2. Click **"App registrations"** in the left menu
3. Click **"+ New registration"** at the top

### 3. Register Your Application

Fill in the following details:

**Name:**
```
Email Improvement App
```

**Supported account types:**
- Select: **"Accounts in any organizational directory (Any Azure AD directory - Multitenant) and personal Microsoft accounts (e.g. Skype, Xbox)"**

**Redirect URI:**
- Platform: **"Public client/native (mobile & desktop)"**
- URI: `http://localhost:3000/auth/callback`

Click **"Register"**

### 4. Copy Your Client ID

After registration, you'll see the **Overview** page:

1. Find **"Application (client) ID"**
2. **COPY THIS VALUE** - you'll need it for your `.env` file
3. Example: `12345678-1234-1234-1234-123456789abc`

### 5. Configure API Permissions

1. In the left menu, click **"API permissions"**
2. Click **"+ Add a permission"**
3. Select **"Microsoft Graph"**
4. Select **"Delegated permissions"**
5. Search for and add these permissions:
   - ☑️ `User.Read`
   - ☑️ `Mail.Read`
   - ☑️ `Mail.ReadWrite`
   - ☑️ `Mail.Send`
   - ☑️ `MailboxSettings.Read`

6. Click **"Add permissions"**
7. Click **"Grant admin consent for [Your Organization]"** (if available)

### 6. Enable Public Client Flow

1. In the left menu, click **"Authentication"**
2. Scroll down to **"Advanced settings"**
3. Find **"Allow public client flows"**
4. Toggle it to **"Yes"**
5. Click **"Save"** at the top

### 7. Configure Your App

1. Create a `.env` file in your project root:
```bash
cp .env.example .env
```

2. Edit `.env` and add your Client ID:
```
VITE_MICROSOFT_CLIENT_ID=your-client-id-here
VITE_MICROSOFT_TENANT_ID=common
```

Replace `your-client-id-here` with the Application (client) ID you copied in Step 4.

## Testing the Setup

1. **Start the app:**
   ```bash
   npm run dev
   ```

2. **In the Settings screen:**
   - Click "Connect Microsoft Account"
   - A popup will appear with a device code
   - Follow the instructions to sign in
   - The popup will close automatically when done

3. **Check authentication:**
   - You should see your email address in the Settings screen
   - Click the Mail icon in the sidebar
   - Your emails should load!

## Troubleshooting

### "AADSTS7000218: The request body must contain the following parameter: 'client_assertion' or 'client_secret'"

**Solution:** Make sure "Allow public client flows" is set to "Yes" in Authentication settings.

### "AADSTS50011: The redirect URI specified in the request does not match"

**Solution:** Verify your redirect URI is exactly `http://localhost:3000/auth/callback` in both Azure and your code.

### "Insufficient privileges to complete the operation"

**Solution:**
1. Go back to API permissions in Azure
2. Click "Grant admin consent"
3. If unavailable, you may need an admin to approve permissions

### "Client ID not configured"

**Solution:** Make sure your `.env` file exists and contains `VITE_MICROSOFT_CLIENT_ID=your-actual-id`

## Security Notes

✅ **Safe to commit:**
- Client ID (it's public)
- Tenant ID

❌ **NEVER commit:**
- Access tokens
- Refresh tokens
- User credentials

Your Client ID is safe to share - it's designed to be public for desktop apps. The security comes from the user authentication flow, not from hiding the Client ID.

## Alternative: Use Personal Microsoft Account

If you don't have Azure AD access:

1. Use https://aka.ms/AppRegistrations
2. Sign in with your personal Microsoft account
3. Follow the same steps above
4. Works with Outlook.com, Hotmail, Live, etc.

## Need Help?

- Azure AD Docs: https://learn.microsoft.com/en-us/azure/active-directory/
- Microsoft Graph: https://learn.microsoft.com/en-us/graph/
- MSAL.js Docs: https://learn.microsoft.com/en-us/azure/active-directory/develop/msal-overview

---

**Next Steps:** Once configured, you can access your emails through the app!
