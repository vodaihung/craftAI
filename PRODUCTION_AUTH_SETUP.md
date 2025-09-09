# Production Authentication Setup Guide

## Environment Variables Required for Production

Make sure your production environment has these environment variables set:

### Required Variables
```bash
# Database
DATABASE_URL="your-production-database-url"

# Authentication - CRITICAL: Use a strong, unique secret for production
JWT_SECRET="your-super-secure-production-jwt-secret-at-least-32-characters-long"
NEXTAUTH_SECRET="your-super-secure-production-jwt-secret-at-least-32-characters-long"

# Node Environment
NODE_ENV="production"

# Optional: Cookie Domain (for subdomain support)
COOKIE_DOMAIN=".yourdomain.com"  # Only if you need subdomain cookie sharing

# API Keys (if using AI features)
OPENAI_API_KEY="your-openai-api-key"
ANTHROPIC_API_KEY="your-anthropic-api-key"
```

## Common Production Issues and Solutions

### 1. JWT Secret Mismatch
**Problem**: Users get redirected to login after successful authentication
**Solution**: Ensure `JWT_SECRET` and `NEXTAUTH_SECRET` are identical and properly set in production

### 2. Cookie Security Issues
**Problem**: Cookies not being set in production
**Solutions**:
- Ensure your production site uses HTTPS (required for secure cookies)
- Check that `NODE_ENV=production` is set
- If using subdomains, set `COOKIE_DOMAIN` appropriately

### 3. HTTPS Requirements
**Problem**: Authentication works in development but not production
**Solution**: Production requires HTTPS for secure cookies. Ensure your deployment platform provides HTTPS.

### 4. Domain/CORS Issues
**Problem**: Authentication fails on custom domains
**Solutions**:
- Set `COOKIE_DOMAIN` if using subdomains
- Ensure your domain is properly configured in your deployment platform

## Debugging Production Issues

The application now includes production logging. Check your production logs for:

1. **JWT Configuration Logs**:
   ```
   JWT_SECRET configured: true/false
   NEXTAUTH_SECRET configured: true/false
   ```

2. **Cookie Setting Logs**:
   ```
   Setting production cookie: { name, secure, sameSite, domain, maxAge }
   ```

3. **Middleware Logs**:
   ```
   Middleware check: { pathname, hasAuthToken, hasSession }
   ```

4. **Session Logs**:
   ```
   Session check: { hasAuthToken, hasSession, sessionUserId }
   ```

## Deployment Platform Specific Notes

### Vercel
- Set environment variables in the Vercel dashboard
- Ensure your domain is properly configured
- HTTPS is automatically provided

### Netlify
- Set environment variables in site settings
- HTTPS is automatically provided

### Railway/Render
- Set environment variables in the dashboard
- HTTPS is automatically provided

### Self-hosted
- Ensure HTTPS is properly configured (use nginx/Apache with SSL)
- Set environment variables in your deployment script

## Security Best Practices

1. **JWT Secret**: Use a cryptographically secure random string (at least 32 characters)
2. **Environment Variables**: Never commit production secrets to version control
3. **HTTPS**: Always use HTTPS in production
4. **Cookie Security**: The app automatically sets secure cookies in production

## Testing Production Authentication

1. Deploy with proper environment variables
2. Test login/signup flow
3. Check browser developer tools for:
   - Cookies being set properly
   - No console errors
   - Proper redirects after authentication

4. Check production logs for any authentication errors

## Quick Fix Checklist

If authentication is still not working in production:

- [ ] `JWT_SECRET` is set and matches between login and verification
- [ ] `NODE_ENV=production` is set
- [ ] Site is using HTTPS
- [ ] Database connection is working
- [ ] Check production logs for specific error messages
- [ ] Clear browser cookies and try again
- [ ] Test with different browsers/incognito mode
