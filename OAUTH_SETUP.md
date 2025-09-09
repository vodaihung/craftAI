# OAuth Setup Guide for FormCraft AI

This guide will help you set up Google and GitHub OAuth for the FormCraft AI authentication system.

## 🔧 Google OAuth Setup

### Step 1: Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API (or Google Identity API)

### Step 2: Create OAuth 2.0 Credentials
1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth 2.0 Client IDs**
3. Choose **Web application** as the application type
4. Add these authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (for development)
   - `https://yourdomain.com/api/auth/callback/google` (for production)

### Step 3: Get Your Credentials
1. Copy the **Client ID** and **Client Secret**
2. Add them to your `.env.local` file:
   ```
   GOOGLE_CLIENT_ID="your-google-client-id-here"
   GOOGLE_CLIENT_SECRET="your-google-client-secret-here"
   ```

## 🐙 GitHub OAuth Setup

### Step 1: Create a GitHub OAuth App
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **OAuth Apps** > **New OAuth App**

### Step 2: Configure the OAuth App
1. **Application name**: `FormCraft AI`
2. **Homepage URL**: `http://localhost:3000` (for development)
3. **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Click **Register application**

### Step 3: Get Your Credentials
1. Copy the **Client ID**
2. Generate a new **Client Secret**
3. Add them to your `.env.local` file:
   ```
   GITHUB_CLIENT_ID="your-github-client-id-here"
   GITHUB_CLIENT_SECRET="your-github-client-secret-here"
   ```

## 🔐 Complete Environment Variables

Your `.env.local` file should look like this:

```bash
# Database
DATABASE_URL="your-neon-database-url"

# AI API Keys
OPENAI_API_KEY="your-openai-api-key"
ANTHROPIC_API_KEY=""

# Auth.js Configuration
NEXTAUTH_SECRET="your-nextauth-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# GitHub OAuth
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

## 🚀 Testing the Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000/auth/signin`

3. You should see both Google and GitHub sign-in options

4. Test both providers to ensure they work correctly

## 🔒 Security Notes

- **Never commit your OAuth credentials to version control**
- Use different OAuth apps for development and production
- Regularly rotate your client secrets
- Monitor your OAuth app usage in the respective dashboards

## 🐛 Troubleshooting

### Common Issues:

1. **"client_id is required" error**
   - Make sure your environment variables are set correctly
   - Restart your development server after adding credentials

2. **"redirect_uri_mismatch" error**
   - Check that your callback URLs match exactly in the OAuth app settings
   - Ensure there are no trailing slashes

3. **"access_denied" error**
   - The user cancelled the OAuth flow
   - Check your OAuth app permissions and scopes

### Debug Mode:
The authentication system runs in debug mode during development. Check your console for detailed error messages.

## 📞 Support

If you encounter issues:
1. Check the [NextAuth.js documentation](https://next-auth.js.org/)
2. Review the provider-specific guides:
   - [Google Provider](https://next-auth.js.org/providers/google)
   - [GitHub Provider](https://next-auth.js.org/providers/github)
3. Check the browser console and server logs for error messages
