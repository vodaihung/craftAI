# Logout Implementation Guide

This document describes the comprehensive logout functionality implemented in FormCraft AI, including automatic cookie cleanup when tabs are closed.

## Features

### 1. Complete Logout Functionality
- ✅ Proper NextAuth.js session termination
- ✅ Cookie cleanup (all NextAuth cookies)
- ✅ Local storage cleanup (preserves theme preferences)
- ✅ Session storage cleanup
- ✅ Graceful error handling
- ✅ Custom logout API endpoint

### 2. Tab Close Cookie Cleanup
- ✅ Automatic cookie cleanup when tab is closed
- ✅ Cleanup when tab becomes hidden (user switches tabs)
- ✅ Cleanup on page unload events
- ✅ Preserves user preferences (theme, etc.)

### 3. User Interface
- ✅ User menu component with logout button
- ✅ Loading states during logout
- ✅ Error handling with user feedback
- ✅ Responsive design

## Implementation Details

### Files Created/Modified

#### New Files:
1. `src/components/user-menu.tsx` - Main user menu with logout functionality
2. `src/hooks/use-logout.ts` - Custom logout hook with comprehensive cleanup
3. `src/app/api/auth/logout/route.ts` - Custom logout API endpoint
4. `src/components/logout-demo.tsx` - Demo component for testing

#### Modified Files:
1. `src/app/api/auth/[...nextauth]/route.ts` - Enhanced NextAuth configuration
2. `src/app/page.tsx` - Added user menu
3. `src/app/dashboard/page.tsx` - Added user menu
4. `src/app/create/page.tsx` - Added user menu

### Key Components

#### 1. UserMenu Component (`src/components/user-menu.tsx`)
```typescript
// Features:
- Session-aware rendering
- Dropdown menu with user info
- Logout button with loading state
- Automatic tab close cleanup setup
- Click-outside-to-close functionality
```

#### 2. useLogout Hook (`src/hooks/use-logout.ts`)
```typescript
// Features:
- Configurable logout options
- Cookie cleanup (all NextAuth cookies)
- Storage cleanup (selective)
- Error handling
- Custom API call for server-side cleanup
- Tab close cleanup utilities
```

#### 3. Logout API Endpoint (`src/app/api/auth/logout/route.ts`)
```typescript
// Features:
- Server-side session cleanup
- Cookie clearing via HTTP headers
- Error handling
- Logging for audit purposes
```

### Cookie Cleanup Details

The implementation clears the following NextAuth cookies:
- `next-auth.session-token`
- `__Secure-next-auth.session-token`
- `next-auth.csrf-token`
- `__Host-next-auth.csrf-token`
- `next-auth.callback-url`
- `__Secure-next-auth.callback-url`
- `next-auth.pkce.code_verifier`
- `__Secure-next-auth.pkce.code_verifier`

### Storage Cleanup Details

#### Cleared Items:
- All session storage
- Specific localStorage items:
  - `user-session`
  - `auth-token`
  - `user-data`
  - `form-drafts`
  - `temp-session`

#### Preserved Items:
- Theme preferences (`formcraft-theme`)
- Other user preferences
- Non-sensitive cached data

## Usage

### Basic Logout
```typescript
import { useLogout } from '@/hooks/use-logout'

const { logout, isLoading } = useLogout()

// Simple logout
await logout()
```

### Advanced Logout with Options
```typescript
const { logout } = useLogout({
  redirectTo: '/custom-page',
  clearStorage: true,
  onSuccess: () => console.log('Logged out successfully'),
  onError: (error) => console.error('Logout failed:', error)
})
```

### Tab Close Cleanup Only
```typescript
import { useTabCloseCleanup } from '@/hooks/use-logout'

const { setupTabCloseCleanup } = useTabCloseCleanup()

useEffect(() => {
  const cleanup = setupTabCloseCleanup()
  return cleanup
}, [])
```

## Testing

### Manual Testing
1. Sign in to the application
2. Open browser developer tools (Network/Application tabs)
3. Click the user menu and select "Sign Out"
4. Verify cookies are cleared
5. Verify redirect to home page

### Tab Close Testing
1. Sign in to the application
2. Open browser developer tools (Application tab)
3. View cookies and local storage
4. Close the tab or navigate away
5. Reopen and check that session cookies are cleared

### Demo Component
A demo component is available at the bottom-right of the home page when logged in. It provides buttons to test different logout scenarios:
- Clear cookies only
- Clear storage only
- Test tab close cleanup
- Full logout

## Security Considerations

1. **Cookie Security**: Cookies are cleared with proper security flags
2. **Storage Cleanup**: Sensitive data is removed while preserving user preferences
3. **Server-side Cleanup**: Custom API endpoint ensures server-side session invalidation
4. **Error Handling**: Graceful fallbacks ensure logout completes even if errors occur
5. **CSRF Protection**: NextAuth CSRF tokens are properly cleared

## Browser Compatibility

The implementation works across modern browsers:
- ✅ Chrome/Chromium
- ✅ Firefox
- ✅ Safari
- ✅ Edge

## Environment Configuration

Ensure these environment variables are set:
```env
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3001"
```

## Troubleshooting

### Common Issues:

1. **Cookies not clearing**: Check browser security settings and HTTPS configuration
2. **Logout not redirecting**: Verify NEXTAUTH_URL is correct
3. **Session persisting**: Clear browser cache and cookies manually
4. **API errors**: Check server logs for detailed error messages

### Debug Mode:
Set `debug: true` in NextAuth configuration to see detailed logs.

## Future Enhancements

Potential improvements:
- [ ] Logout from all devices functionality
- [ ] Session timeout warnings
- [ ] Remember device options
- [ ] Audit logging for security compliance
- [ ] Biometric logout confirmation
