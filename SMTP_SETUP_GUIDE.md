# SMTP Email Configuration Guide

## How to Change Email Address and Logo

### 1. Update `.env` File

Edit `backend/.env` and update the following variables:

```env
# SMTP CONFIG
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_SSL=false              # Use lowercase: false/true (not False/True)
EMAIL_USE_TLS=true               # Use lowercase: true/false (not True/False)
EMAIL_HOST_USER=your_new_email@gmail.com
EMAIL_HOST_PASSWORD=your_app_password
DEFAULT_FROM_EMAIL=Your Name <your_new_email@gmail.com>  # Include email in angle brackets
EMAIL_LOGO_URL=https://your-domain.com/logo.png          # Optional: URL to your logo image

# Optional Branding
APP_BRAND_NAME=Your Business Name
SUPPORT_EMAIL=support@yourdomain.com
FRONTEND_URL=https://your-domain.com

# OTP Settings
VERIFICATION_CODE_TTL_MIN=10
VERIFICATION_MAX_ATTEMPTS=5
VERIFICATION_RESEND_COOLDOWN_SEC=60
```

### 2. Important Notes

#### Email Address (`EMAIL_HOST_USER`)
- Use the full email address: `your_email@gmail.com`
- For Gmail, generate an App Password (not your regular password)
- The email must have SMTP access enabled

#### Sender Display Name (`DEFAULT_FROM_EMAIL`)
- Format: `"Display Name" <email@example.com>` or `Display Name <email@example.com>`
- Recipients will see this as the sender name
- Example: `BizClear Business Center <noreply@bizclear.com>`

#### Boolean Values (EMAIL_USE_SSL, EMAIL_USE_TLS)
- Use lowercase: `true` or `false`
- ❌ Wrong: `True`, `False`, `TRUE`, `FALSE`
- ✅ Correct: `true`, `false`

#### Logo Image (`EMAIL_LOGO_URL`)
- Use a publicly accessible URL (https://)
- Recommended size: 200px width, auto height
- Supported formats: PNG, JPG, SVG
- Must be hosted on a web server (not local file path)
- If not set, defaults to: `{FRONTEND_URL}/BizClear.png`
- Example: `https://your-domain.com/images/logo.png`

### 3. How to Host Logo for Email

#### Option A: Use Frontend Public Folder
1. Place logo in `web/public/` folder
2. Access via: `{FRONTEND_URL}/logo.png`
3. Set `EMAIL_LOGO_URL={FRONTEND_URL}/logo.png`

#### Option B: Use External URL
1. Upload logo to cloud storage (e.g., AWS S3, Google Cloud Storage)
2. Make it publicly accessible
3. Use the full URL: `EMAIL_LOGO_URL=https://storage.example.com/logo.png`

#### Option C: Use CDN
1. Use a CDN service (e.g., Cloudflare, jsDelivr)
2. Set `EMAIL_LOGO_URL=https://cdn.example.com/logo.png`

### 4. After Making Changes

1. **Save** the `.env` file
2. **Restart** the backend server:
   ```bash
   # Stop server (Ctrl+C)
   npm start
   ```

### 5. Test Configuration

Send a test OTP email:
```bash
curl -X POST http://localhost:3000/api/auth/signup/start \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "recipient@example.com",
    "phoneNumber": "",
    "password": "Password123",
    "termsAccepted": true
  }'
```

Check the email inbox to verify:
- ✅ Email address appears correctly
- ✅ Logo displays in the header
- ✅ Sender name is correct

### 6. Troubleshooting

#### Logo Not Showing
- Ensure URL is publicly accessible (test in browser)
- Use HTTPS URL (many email clients block HTTP images)
- Check image format is supported (PNG, JPG, SVG)
- Verify logo URL in email HTML source

#### Email Not Sending
- Check `EMAIL_USE_SSL` and `EMAIL_USE_TLS` are lowercase
- Verify `EMAIL_HOST_PASSWORD` is correct (no spaces for app passwords)
- Ensure `DEFAULT_FROM_EMAIL` includes the email: `Name <email@domain.com>`
- Check backend logs for SMTP errors

#### Wrong Sender Name
- Format `DEFAULT_FROM_EMAIL` correctly: `"Name" <email@domain.com>`
- Restart server after changes
