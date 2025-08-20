# Supabase Dashboard Security Configuration

## Steps to Fix Remaining Security Warnings

### 1. Enable Leaked Password Protection

1. Open your Supabase Dashboard
2. Navigate to **Authentication** > **Settings** > **Security**
3. Find the section "Password Security"
4. Enable the toggle for **"Check password against HaveIBeenPwned database"**
5. Save the changes

This will prevent users from using passwords that have been compromised in data breaches.

### 2. Configure Additional MFA Options

1. Go to **Authentication** > **Settings** > **Multi-Factor Authentication**
2. Currently, TOTP (Time-based One-Time Password) is likely the only enabled method
3. Enable additional MFA methods:

#### Available Options:
- **SMS**: Requires Twilio integration
  - Go to **Authentication** > **Settings** > **External Providers** > **Phone Auth**
  - Configure your Twilio credentials
  
- **WhatsApp**: Requires Twilio integration
  - Same configuration as SMS but enable WhatsApp option
  
- **Phone Call**: Requires Twilio integration  
  - Same configuration as SMS but enable Phone Call option

- **Email OTP**: Usually enabled by default
  - Verify it's enabled in **Authentication** > **Settings** > **Email Templates**

#### Recommended Setup:
1. Enable **Email OTP** (should already be enabled)
2. Enable **SMS** if you have Twilio configured
3. Keep **TOTP** enabled (Authenticator apps like Google Authenticator)

## Verification

After making these changes:
1. Run the SQL file `fix_all_security_warnings.sql` to fix the function issues
2. Wait a few minutes and run the security lint check again in Supabase
3. All warnings should be resolved

## Security Benefits

- **Function Search Path**: Prevents SQL injection attacks through search path manipulation
- **Leaked Password Protection**: Blocks use of compromised passwords from data breaches  
- **Multiple MFA Options**: Provides users flexibility while maintaining strong security