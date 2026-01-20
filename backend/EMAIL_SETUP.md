# Email Configuration Guide

## Quick Setup for OTP Emails

To send real OTP emails during signup, you need to configure email settings in your `.env` file.

### Required Environment Variables

Add these to your `backend/.env` file (or `backend/services/auth-service/.env` if using microservices):

```bash
# Email Provider Configuration
EMAIL_API_KEY=your_api_key_here
EMAIL_API_PROVIDER=sendgrid
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
```

### Supported Email Providers

1. **SendGrid** (Recommended - Free tier available)
   - Get API key: https://app.sendgrid.com/settings/api_keys
   - Verify sender email: Settings → Sender Authentication
   - Example: `EMAIL_API_PROVIDER=sendgrid`

2. **Mailgun**
   - Get API key: https://app.mailgun.com/app/api_keys
   - Set domain: `MAILGUN_DOMAIN=yourdomain.com`
   - Example: `EMAIL_API_PROVIDER=mailgun`

3. **Resend**
   - Get API key: https://resend.com/api-keys
   - Example: `EMAIL_API_PROVIDER=resend`

4. **Postmark**
   - Get API token: https://account.postmarkapp.com/api_tokens
   - Example: `EMAIL_API_PROVIDER=postmark`

### Development Mode (Mock Emails)

If `EMAIL_API_KEY` is not set in development mode, the system will use **mock emails** that:
- Log the OTP code to the console
- Do NOT actually send emails
- Allow you to test the signup flow

**To see mock email OTP codes:**
- Check your backend console/logs
- Look for messages like: `📧 MOCK EMAIL - OTP CODE`

**To disable mock emails and see real errors:**
```bash
USE_MOCK_EMAILS=false
```

### Verification Steps

1. **Check your .env file** has the required variables
2. **Restart your backend server** after changing .env
3. **Check backend logs** when signing up:
   - If mock: You'll see `📧 MOCK EMAIL` messages
   - If real: You'll see `✅ OTP email sent successfully`
4. **Check your email inbox** (and spam folder)

### Troubleshooting

**Problem: Emails not being sent**
- ✅ Check `EMAIL_API_KEY` is set correctly
- ✅ Check `DEFAULT_FROM_EMAIL` is a valid email address
- ✅ Verify sender email is verified with your provider
- ✅ Check backend logs for error messages
- ✅ Check spam/junk folder

**Problem: Getting mock emails instead of real emails**
- Set `USE_MOCK_EMAILS=false` in .env
- Ensure `EMAIL_API_KEY` is set
- Check `NODE_ENV` is not set to 'production' (unless you want production mode)

**Problem: API errors**
- Verify API key is correct
- Check API key has "Mail Send" permissions
- Verify sender email is verified with provider
- Check provider status page for outages

### Example .env Configuration

```bash
# Email Configuration
EMAIL_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_API_PROVIDER=sendgrid
DEFAULT_FROM_EMAIL=noreply@yourdomain.com

# Optional: Disable mock emails in development
USE_MOCK_EMAILS=false

# Optional: App branding
APP_BRAND_NAME=BizClear Business Center
FRONTEND_URL=http://localhost:5173
```

### Testing Email Configuration

1. Start your backend server
2. Try to sign up with a test email
3. Check backend console logs:
   - Look for `[Email Config]` messages
   - Look for `[Email API]` messages
   - If mock: Look for `📧 MOCK EMAIL` section with OTP code
   - If real: Look for `✅ OTP email sent successfully`

### Need Help?

- Check backend console logs for detailed error messages
- Verify your email provider account is active
- Ensure sender email is verified
- Check provider documentation for API requirements
