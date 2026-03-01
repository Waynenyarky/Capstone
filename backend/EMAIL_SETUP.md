# Email Configuration Guide

## Quick Setup for OTP Emails

To send real OTP emails during signup, you need to configure email settings in your `.env` file.

### Required Environment Variables

Add these to your `backend/.env` file (or `backend/services/auth-service/.env` if using microservices):

```bash
# Email Provider Configuration (default: Resend)
EMAIL_API_KEY=your_api_key_here
EMAIL_API_PROVIDER=resend
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
```

### Supported Email Providers

1. **Resend** (Default – simple API, good deliverability)
   - Get API key: https://resend.com/api-keys
   - **No domain?** Use `DEFAULT_FROM_EMAIL=onboarding@resend.dev` — no verification needed; you can send to any email.
   - With your own domain: verify it at https://resend.com/domains
   - Example: `EMAIL_API_PROVIDER=resend`

2. **SendGrid**
   - Get API key: https://app.sendgrid.com/settings/api_keys
   - Verify sender email: Settings → Sender Authentication
   - Example: `EMAIL_API_PROVIDER=sendgrid`

3. **Mailgun**
   - Get API key: https://app.mailgun.com/app/api_keys
   - Set domain: `MAILGUN_DOMAIN=yourdomain.com`
   - Example: `EMAIL_API_PROVIDER=mailgun`

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

**Problem: Resend 403 "You can only send testing emails to your own email address"**
- When using `DEFAULT_FROM_EMAIL=onboarding@resend.dev` (no verified domain), Resend only allows sending **to** the email address on your Resend account. Use that address when testing (e.g. `node backend/scripts/test-sendgrid.js your@resend-account-email.com`).
- To send to any recipient (e.g. signup OTPs to users): verify a domain at [resend.com/domains](https://resend.com/domains) and set `DEFAULT_FROM_EMAIL` to an address on that domain (e.g. `noreply@yourdomain.com`).
- **Dev workaround:** Set `EMAIL_DEV_REDIRECT_TO` in `.env` to your Resend account email (e.g. `stephendiaz.syv@gmail.com`). All outgoing emails (OTPs, password reset, etc.) will be delivered to that address instead of the requested recipient, so you can use Resend with `onboarding@resend.dev` and still receive dev emails for any user (Mailinator, seeded accounts, etc.). Logs will show "dev redirect" with the original recipient.

### Example .env Configuration (Resend)

```bash
# Email Configuration
EMAIL_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_API_PROVIDER=resend
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
