const axios = require('axios')
const logger = require('./logger')

/**
 * Email API Service - REST API Implementation
 * Supports multiple providers: SendGrid, Mailgun, AWS SES, Resend, Postmark
 * Default: Resend
 */

// Helper function to create mock email sender (for development)
function createMockEmailSender() {
  return async (opts) => {
    const codeMatch = opts.html?.match(/(\d{6})/) || opts.text?.match(/(\d{6})/)
    logger.warn('Email: using mock sender (no API key). OTP in logs only.', { to: opts.to, subject: opts.subject, otpCode: codeMatch ? codeMatch[1] : undefined })
    // Simulate successful send
    await new Promise(resolve => setTimeout(resolve, 50))
    return { 
      messageId: 'mock-id-' + Date.now(), 
      accepted: [opts.to], 
      rejected: [],
      response: '250 OK'
    }
  }
}

/**
 * Send email via REST API (SendGrid, Mailgun, etc.)
 * @param {object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.from - Sender email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML content
 * @returns {Promise<object>} Result with success, messageId, accepted, rejected
 */
async function sendEmailViaAPI({ to, from, subject, text, html, headers = {} }) {
  const provider = process.env.EMAIL_API_PROVIDER || 'resend'
  const apiKey = process.env.EMAIL_API_KEY
  const apiUrl = process.env.EMAIL_API_URL

  // Dev redirect: send all emails to one address (e.g. your Resend account email) so you can
  // use Resend with onboarding@resend.dev and still receive OTPs for any dev user (Mailinator, etc.).
  const devRedirectTo = process.env.EMAIL_DEV_REDIRECT_TO
  let actualTo = to
  if (devRedirectTo && devRedirectTo.includes('@')) {
    logger.info('Email: dev redirect active', { originalTo: to, redirectTo: devRedirectTo })
    actualTo = devRedirectTo.trim()
  }

  // No API key: use mock in all modes (dev, demo-ui, demo, production) so the app never breaks.
  // To receive real emails in any mode, set EMAIL_API_KEY in .env (e.g. Resend, SendGrid).
  const placeholderKeys = ['your-sendgrid-api-key-here', 'your-email-api-key-here', 'your-resend-api-key-here']
  if (!apiKey || placeholderKeys.some(p => apiKey === p)) {
    logger.warn('Email API key not set or placeholder. Using mock sender (code in logs/UI only).')
    const mockSender = createMockEmailSender()
    return await mockSender({ to: actualTo, subject, text, html })
  }

  try {
    switch (provider.toLowerCase()) {
      case 'sendgrid':
        return await sendViaSendGrid({ to: actualTo, from, subject, text, html, headers, apiKey, apiUrl })
      case 'mailgun':
        return await sendViaMailgun({ to: actualTo, from, subject, text, html, headers, apiKey, apiUrl })
      case 'ses':
      case 'aws-ses':
        return await sendViaAWSSES({ to: actualTo, from, subject, text, html, headers, apiKey, apiUrl })
      case 'resend':
        return await sendViaResend({ to: actualTo, from, subject, text, html, headers, apiKey, apiUrl })
      case 'postmark':
        return await sendViaPostmark({ to: actualTo, from, subject, text, html, headers, apiKey, apiUrl })
      default:
        throw new Error(`Unsupported email provider: ${provider}. Supported: sendgrid, mailgun, ses, resend, postmark`)
    }
  } catch (err) {
    if (err.response) {
      logger.error('Email API error', {
        status: err.response.status,
        statusText: err.response.statusText,
        data: err.response.data,
        provider,
      })
    } else {
      logger.error('Email API error', { error: err.message })
    }
    // Do not fall back to mock on API errors: the user would see "verification sent"
    // but receive no email. Let the error propagate so the client gets a clear failure
    // (e.g. "Failed to send verification email") and can fix config (e.g. verify sender in SendGrid).
    throw err
  }
}

/**
 * Send email via SendGrid API
 */
async function sendViaSendGrid({ to, from, subject, text, html, headers, apiKey, apiUrl }) {
  // SendGrid API endpoint - always use the mail/send endpoint
  const url = 'https://api.sendgrid.com/v3/mail/send'
  
  // Validate required fields
  if (!apiKey || !apiKey.startsWith('SG.')) {
    throw new Error('Invalid SendGrid API key. API key must start with "SG."')
  }
  
  if (!from || !to) {
    throw new Error('From and To email addresses are required')
  }
  
  const emailData = {
    personalizations: [{
      to: [{ email: to }],
      subject: subject
    }],
    from: { email: from },
    content: [
      { type: 'text/plain', value: text },
      { type: 'text/html', value: html }
    ]
  }

  // Add custom headers if provided
  if (headers && Object.keys(headers).length > 0) {
    emailData.headers = headers
  }

  try {
    const response = await axios.post(url, emailData, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    // SendGrid returns 202 Accepted on success
    if (response.status === 202) {
      return {
        success: true,
        messageId: response.headers['x-message-id'] || `sg-${Date.now()}`,
        accepted: [to],
        rejected: []
      }
    }

    throw new Error(`SendGrid API returned unexpected status: ${response.status}`)
  } catch (error) {
    // Provide more detailed error information
    if (error.response) {
      const status = error.response.status
      const data = error.response.data
      
      if (status === 401) {
        throw new Error('SendGrid API: Unauthorized - Invalid API key. Please check your EMAIL_API_KEY in .env file.')
      } else if (status === 403) {
        throw new Error('SendGrid API: Forbidden - API key does not have Mail Send permissions.')
      } else if (status === 404) {
        throw new Error('SendGrid API: Not Found - Invalid endpoint or API key. Ensure your API key is valid and has Mail Send permissions.')
      } else if (status === 400) {
        const errorMsg = data?.errors?.[0]?.message || JSON.stringify(data)
        throw new Error(`SendGrid API: Bad Request - ${errorMsg}. Check that your sender email (${from}) is verified in SendGrid.`)
      } else {
        throw new Error(`SendGrid API Error (${status}): ${JSON.stringify(data)}`)
      }
    }
    throw error
  }
}

/**
 * Send email via Mailgun API
 */
async function sendViaMailgun({ to, from, subject, text, html, headers, apiKey, apiUrl }) {
  // Extract domain from apiUrl or use default
  const domain = process.env.MAILGUN_DOMAIN || (apiUrl ? new URL(apiUrl).hostname.split('.')[0] : '')
  if (!domain) {
    throw new Error('MAILGUN_DOMAIN is required for Mailgun provider')
  }

  const url = apiUrl || `https://api.mailgun.net/v3/${domain}/messages`
  
  const formData = new URLSearchParams()
  formData.append('from', from)
  formData.append('to', to)
  formData.append('subject', subject)
  formData.append('text', text)
  formData.append('html', html)

  // Add custom headers
  if (headers && Object.keys(headers).length > 0) {
    Object.entries(headers).forEach(([key, value]) => {
      formData.append(`h:${key}`, value)
    })
  }

  const response = await axios.post(url, formData, {
    headers: {
      'Authorization': `Basic ${Buffer.from(`api:${apiKey}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })

  if (response.status === 200 && response.data) {
    return {
      success: true,
      messageId: response.data.id || `mg-${Date.now()}`,
      accepted: [to],
      rejected: []
    }
  }

  throw new Error(`Mailgun API returned unexpected status: ${response.status}`)
}

/**
 * Send email via AWS SES API
 */
async function sendViaAWSSES({ to, from, subject, text, html, headers, apiKey, apiUrl }) {
  // AWS SES requires AWS SDK, but for REST API we'll use SES API endpoint
  // Note: This is a simplified implementation. Full AWS SES requires AWS SDK or more complex REST calls
  const url = apiUrl || 'https://email.us-east-1.amazonaws.com'
  
  // AWS SES REST API requires AWS Signature Version 4 signing
  // For capstone, recommend using AWS SDK instead, but keeping REST API pattern
  throw new Error('AWS SES REST API requires AWS SDK. Use @aws-sdk/client-ses or switch to SendGrid/Mailgun for simpler REST API implementation.')
}

/**
 * Send email via Resend API
 */
async function sendViaResend({ to, from, subject, text, html, headers, apiKey, apiUrl }) {
  const url = apiUrl || 'https://api.resend.com/emails'
  
  const emailData = {
    from: from,
    to: [to],
    subject: subject,
    text: text,
    html: html
  }

  // Add custom headers
  if (headers && Object.keys(headers).length > 0) {
    emailData.headers = headers
  }

  const response = await axios.post(url, emailData, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  })

  if (response.status === 200 && response.data) {
    return {
      success: true,
      messageId: response.data.id || `resend-${Date.now()}`,
      accepted: [to],
      rejected: []
    }
  }

  throw new Error(`Resend API returned unexpected status: ${response.status}`)
}

/**
 * Send email via Postmark API
 */
async function sendViaPostmark({ to, from, subject, text, html, headers, apiKey, apiUrl }) {
  const url = apiUrl || 'https://api.postmarkapp.com/email'
  
  const emailData = {
    From: from,
    To: to,
    Subject: subject,
    TextBody: text,
    HtmlBody: html
  }

  // Add custom headers
  if (headers && Object.keys(headers).length > 0) {
    emailData.Headers = Object.entries(headers).map(([key, value]) => ({ Name: key, Value: value }))
  }

  const response = await axios.post(url, emailData, {
    headers: {
      'X-Postmark-Server-Token': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  })

  if (response.status === 200 && response.data) {
    return {
      success: true,
      messageId: response.data.MessageID || `postmark-${Date.now()}`,
      accepted: [to],
      rejected: []
    }
  }

  throw new Error(`Postmark API returned unexpected status: ${response.status}`)
}

// Purpose-specific copy for OTP emails (heading + intro). Intro may use {{brandName}}.
const OTP_PURPOSE_COPY = {
  login: {
    heading: 'Verification Code',
    intro: `You recently requested to sign in to your {{brandName}} account. Use the code below to complete your verification.`,
  },
  signup: {
    heading: 'Verify Your Email',
    intro: `You're signing up for {{brandName}}. Use the code below to verify your email and complete registration.`,
  },
  email_change: {
    heading: 'Confirm Email Change',
    intro: `You requested to change the email address for your account. Use the code below to confirm this change.`,
  },
  password_change: {
    heading: 'Confirm Password Change',
    intro: `You requested to change your password. Use the code below to confirm your identity and complete the change.`,
  },
  password_reset: {
    heading: 'Reset Your Password',
    intro: `You requested to reset your password. Use the code below to set a new password. If you didn't request this, you can safely ignore this email.`,
  },
  account_deletion: {
    heading: 'Confirm Account Deletion',
    intro: `You requested to permanently delete your account. Use the code below to confirm account deletion. This action cannot be undone after the grace period.`,
  },
  mfa_setup: {
    heading: 'Enable Verification',
    intro: `You're enabling fingerprint or additional verification. Use the code below to complete setup.`,
  },
  generic: {
    heading: 'Verification Code',
    intro: `You requested a verification code. Use the code below to complete your request.`,
  },
}

const VALID_OTP_PURPOSES = new Set(Object.keys(OTP_PURPOSE_COPY))

async function sendOtp({ to, code, subject = 'Your verification code', from = process.env.DEFAULT_FROM_EMAIL || process.env.EMAIL_HOST_USER, purpose = 'login' }) {
  const ttlMin = Number(process.env.VERIFICATION_CODE_TTL_MIN || 10)
  const brandName = process.env.APP_BRAND_NAME || 'BizClear Business Center'
  const supportEmail = process.env.SUPPORT_EMAIL || process.env.EMAIL_HOST_USER || 'support@bizclear.com'
  const appUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:5173'

  const purposeKey = VALID_OTP_PURPOSES.has(purpose) ? purpose : 'generic'
  const { heading, intro } = OTP_PURPOSE_COPY[purposeKey]
  const introText = intro.replace(/\{\{brandName\}\}/g, brandName)
  const introHtml = intro.replace(/\{\{brandName\}\}/g, `<strong>${brandName}</strong>`)

  const text = [
    'Hello,',
    '',
    introText,
    '',
    `Your verification code is: ${code}`,
    `This code expires in ${ttlMin} minutes.`,
    '',
    "If you didn't request this, you can safely ignore this email.",
    '',
    'Thank you,',
    brandName
  ].join('\n')
  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://fonts.googleapis.com/css2?family=Raleway:wght@400;600;700&display=swap" rel="stylesheet">
  </head>
  <body style="margin:0;padding:0;font-family:'Raleway', sans-serif;">
  <div style="background:#f0f2f5;padding:40px 0;margin:0;font-family:'Raleway', sans-serif;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.08);overflow:hidden;">
      
      <!-- Header -->
      <div style="background:#003a70;padding:32px;text-align:center;">
        <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:1px;font-family:'Raleway', sans-serif;">${brandName}</h1>
      </div>

      <!-- Body -->
      <div style="padding:40px 32px;text-align:center;">
        <h2 style="margin:0 0 16px;font-size:22px;color:#1f1f1f;font-weight:700;font-family:'Raleway', sans-serif;">${heading}</h2>
        
        <p style="margin:0 0 24px;color:#595959;font-size:16px;line-height:1.6;">
          ${introHtml}
        </p>

        <div style="background:#f8f9fa;padding:24px;border-radius:8px;border:1px dashed #003a70;margin-bottom:24px;display:inline-block;">
           <div style="font-size:32px;letter-spacing:8px;color:#003a70;font-weight:700;font-family:monospace;">${code}</div>
        </div>

        <p style="margin:0 0 8px;color:#8c8c8c;font-size:14px;">
           This code expires in ${ttlMin} minutes.
        </p>
        
        <p style="margin:16px 0 0;color:#faad14;font-size:14px;font-weight:600;">
           ⚠️ Important: Do not share this code with anyone.
        </p>
      </div>

      <!-- Footer -->
      <div style="background:#fafafa;padding:24px;text-align:center;border-top:1px solid #f0f0f0;">
        <div style="background:#fffbe6;border:1px solid #ffe58f;padding:16px;border-radius:4px;margin-bottom:24px;text-align:left;">
           <p style="margin:0 0 4px;color:#d48806;font-weight:700;font-size:14px;">Did not request this?</p>
           <p style="margin:0;color:#595959;font-size:13px;line-height:1.5;">
             If this request wasn't made by you, your account may be at risk. 
             <a href="${appUrl}/support/security" style="color:#d48806;text-decoration:underline;font-weight:600;">Report unauthorized access immediately</a>.
           </p>
        </div>
        
        <div style="border-top: 1px solid #e8e8e8; margin-top: 24px; padding-top: 24px; color: #8c8c8c; font-size: 12px; line-height: 1.5;">
          <p style="margin: 0 0 8px;">
            <strong>${brandName}</strong><br>
            Dagupan City, Philippines
          </p>
          <p style="margin: 0 0 8px;">
            <a href="${appUrl}/policy" style="color: #003a70; text-decoration: none;">Privacy Policy</a> • 
            <a href="${appUrl}/terms" style="color: #003a70; text-decoration: none;">Terms of Service</a>
          </p>
          <p style="margin: 0;">
            Need help? <a href="mailto:${supportEmail}" style="color: #003a70; text-decoration: none;">Contact Support</a>
          </p>
          <p style="margin: 16px 0 0; font-size: 11px; color: #bfbfbf;">
            © ${new Date().getFullYear()} ${brandName}. All rights reserved.
          </p>
        </div>
      </div>

    </div>
  </div>
  </body>
  </html>
  `
  
  const isDevelopment = process.env.NODE_ENV !== 'production'
  
  try {
    // Validate email address first
    if (!to || !to.includes('@')) {
      throw new Error(`Invalid email address: ${to}`)
    }
    
    // Ensure 'from' is set
    const fromAddress = from || process.env.DEFAULT_FROM_EMAIL || 'noreply@example.com'
    
    logger.info('Email: sending OTP', { to, provider: process.env.EMAIL_API_PROVIDER || 'resend' })

    const result = await sendEmailViaAPI({
      to,
      from: fromAddress,
      subject,
      text,
      html,
      headers: {
        'X-Mailer': 'BizClear Business Center',
        'List-Unsubscribe': `<${appUrl}/unsubscribe>`
      }
    })
    
    logger.info('Email: OTP sent successfully', { to, messageId: result.messageId, accepted: result.accepted, rejected: result.rejected })

    // Check if email was actually rejected
    if (result.rejected && result.rejected.length > 0) {
      const error = new Error(`Email rejected for: ${result.rejected.join(', ')}`)
      logger.warn('Email: recipients rejected', { to, rejected: result.rejected })
      throw error
    }
    
    return { success: true, messageId: result.messageId, accepted: result.accepted }
  } catch (err) {
    logger.error('Email: OTP send failed', {
      to,
      subject,
      error: err.message,
      apiStatus: err.response?.status,
      apiResponse: err.response?.data,
    })

    // Return failure result instead of silently swallowing
    return { success: false, error: err.message }
  }
}

/**
 * Send "forgot password not available" email for admin/staff (no verification code; user sees not-allowed screen immediately).
 * @param {object} options
 * @param {string} options.to - Recipient email
 * @param {string} [options.code] - Optional 6-digit code (omitted from email when not provided)
 * @param {string} options.roleSlug - User role slug (admin, staff, etc.)
 * @param {string} [options.subject] - Email subject
 * @param {string} [options.from] - From address
 */
async function sendForgotPasswordNotAvailableEmail({ to, code, roleSlug, subject, from = process.env.DEFAULT_FROM_EMAIL || process.env.EMAIL_HOST_USER }) {
  const logger = require('./logger')
  const ttlMin = Number(process.env.VERIFICATION_CODE_TTL_MIN || 10)
  const brandName = process.env.APP_BRAND_NAME || 'BizClear Business Center'
  const appUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:5173'
  const supportEmail = process.env.SUPPORT_EMAIL || process.env.EMAIL_HOST_USER || 'support@bizclear.com'
  const { isStaffRole } = require('./roleHelpers')

  subject = subject || `Password reset request – not available for your account - ${brandName}`

  const isStaff = isStaffRole(roleSlug)
  const instructionText = isStaff
    ? 'If you are staff, use Request Recovery from the staff portal.'
    : 'If you are an administrator, contact another administrator to change your password.'
  const instructionHtml = isStaff
    ? 'If you are <strong>staff</strong>, use <strong>Request Recovery</strong> from the staff portal.'
    : 'If you are an <strong>administrator</strong>, contact another administrator to change your password.'

  const textLines = [
    'Hello,',
    '',
    'You requested a password reset, but password reset is not available for your account type.',
    '',
    instructionText,
    '',
    'This action has been logged and administrators have been alerted to this attempt.',
    '',
  ]
  if (code) {
    textLines.push('Your verification code (to confirm this request): ' + code)
    textLines.push(`This code expires in ${ttlMin} minutes.`)
    textLines.push('')
  }
  textLines.push('Thank you,', brandName)
  const text = textLines.join('\n')

  const codeBlockHtml = code
    ? `
        <p style="margin:0 0 12px;color:#595959;font-size:14px;">Your verification code (to confirm this request):</p>
        <div style="background:#f8f9fa;padding:24px;border-radius:8px;border:1px dashed #003a70;margin-bottom:16px;display:inline-block;">
          <div style="font-size:32px;letter-spacing:8px;color:#003a70;font-weight:700;font-family:monospace;">${code}</div>
        </div>
        <p style="margin:0;color:#8c8c8c;font-size:14px;">This code expires in ${ttlMin} minutes.</p>
      `
    : ''

  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://fonts.googleapis.com/css2?family=Raleway:wght@400;600;700&display=swap" rel="stylesheet">
  </head>
  <body style="margin:0;padding:0;font-family:'Raleway', sans-serif;">
  <div style="background:#f0f2f5;padding:40px 0;margin:0;font-family:'Raleway', sans-serif;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.08);overflow:hidden;">
      <div style="background:#003a70;padding:32px;text-align:center;">
        <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:1px;font-family:'Raleway', sans-serif;">${brandName}</h1>
      </div>
      <div style="padding:40px 32px;text-align:center;">
        <h2 style="margin:0 0 16px;font-size:22px;color:#1f1f1f;font-weight:700;font-family:'Raleway', sans-serif;">Password reset not available</h2>
        <p style="margin:0 0 24px;color:#595959;font-size:16px;line-height:1.6;">
          You requested a password reset, but password reset is <strong>not available</strong> for your account type.
        </p>
        <p style="margin:0 0 16px;color:#595959;font-size:16px;line-height:1.6;">
          ${instructionHtml}
        </p>
        <div style="background:#fff7e6;border:1px solid #ffd591;padding:16px;border-radius:4px;margin-bottom:24px;text-align:left;">
          <p style="margin:0 0 4px;color:#d46b08;font-weight:700;font-size:14px;">Notice</p>
          <p style="margin:0;color:#595959;font-size:14px;line-height:1.5;">
            This action has been logged and administrators have been alerted to this attempt.
          </p>
        </div>
        ${codeBlockHtml}
      </div>
      <div style="background:#fafafa;padding:24px;text-align:center;border-top:1px solid #f0f0f0;">
        <p style="margin:0 0 8px;color:#8c8c8c;font-size:12px;">
          <strong>${brandName}</strong><br>Dagupan City, Philippines
        </p>
        <p style="margin:0;">Need help? <a href="mailto:${supportEmail}" style="color:#003a70;text-decoration:none;">Contact Support</a></p>
        <p style="margin:16px 0 0;font-size:11px;color:#bfbfbf;">© ${new Date().getFullYear()} ${brandName}. All rights reserved.</p>
      </div>
    </div>
  </div>
  </body>
  </html>
  `

  try {
    if (!to || !to.includes('@')) {
      throw new Error(`Invalid email address: ${to}`)
    }
    const fromAddress = from || process.env.DEFAULT_FROM_EMAIL || 'noreply@example.com'
    logger.info('Email: sending forgot-password not available', { to })
    const result = await sendEmailViaAPI({
      to,
      from: fromAddress,
      subject,
      text,
      html,
      headers: { 'X-Mailer': 'BizClear Business Center', 'List-Unsubscribe': `<${appUrl}/unsubscribe>` },
    })
    if (result.rejected && result.rejected.length > 0) {
      const error = new Error(`Email rejected for: ${result.rejected.join(', ')}`)
      logger.warn('Email: recipients rejected', { to, rejected: result.rejected })
      throw error
    }
    return { success: true, messageId: result.messageId, accepted: result.accepted }
  } catch (err) {
    logger.error('Email: sendForgotPasswordNotAvailableEmail failed', { to, error: err.message })
    return { success: false, error: err.message }
  }
}

async function sendStaffCredentialsEmail({ to, username, tempPassword, office, roleLabel, subject = 'Your Staff Account Credentials', from = process.env.DEFAULT_FROM_EMAIL || process.env.EMAIL_HOST_USER }) {
  const brandName = process.env.APP_BRAND_NAME || 'BizClear Business Center'
  const appUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:5173'
  const supportEmail = process.env.SUPPORT_EMAIL || process.env.EMAIL_HOST_USER || 'support@bizclear.com'

  const textLines = [
    `Welcome to ${brandName} Staff Portal`,
    '',
    'Your staff account has been created successfully.',
    '',
    'Here are your login credentials:',
  ]
  if (username) textLines.push(`Username: ${username}`)
  textLines.push(
    `Temporary Password: ${tempPassword}`,
    '',
    `Office: ${office}`,
    `Role: ${roleLabel}`,
    '',
    'Please log in and change your password immediately.',
    `Login here: ${appUrl}/auth/login`,
    '',
    'Thank you,',
    brandName
  )
  const text = textLines.join('\n')

  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://fonts.googleapis.com/css2?family=Raleway:wght@400;600;700&display=swap" rel="stylesheet">
  </head>
  <body style="margin:0;padding:0;font-family:'Raleway', sans-serif;">
  <div style="background:#f0f2f5;padding:40px 0;margin:0;font-family:'Raleway', sans-serif;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.08);overflow:hidden;">
      
      <!-- Header -->
      <div style="background:#003a70;padding:32px;text-align:center;">
        <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:1px;font-family:'Raleway', sans-serif;">${brandName} Staff Portal</h1>
      </div>

      <!-- Body -->
      <div style="padding:40px 32px;text-align:center;">
        <h2 style="margin:0 0 16px;font-size:22px;color:#1f1f1f;font-weight:700;font-family:'Raleway', sans-serif;">Welcome to the Team!</h2>
        
        <p style="margin:0 0 24px;color:#595959;font-size:16px;line-height:1.6;">
          Your staff account has been created. Use the credentials below to access the portal.
        </p>

        <div style="background:#f8f9fa;padding:24px;border-radius:8px;border:1px solid #e8e8e8;margin-bottom:24px;text-align:left;display:inline-block;min-width:300px;">
           ${username ? `<div style="margin-bottom:12px;">
             <span style="color:#8c8c8c;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Username</span><br>
             <span style="color:#003a70;font-size:18px;font-weight:700;">${username}</span>
           </div>` : ''}
           <div style="margin-bottom:12px;">
             <span style="color:#8c8c8c;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Temporary Password</span><br>
             <span style="color:#003a70;font-size:18px;font-weight:700;font-family:monospace;">${tempPassword}</span>
           </div>
           <div style="margin-bottom:12px;">
             <span style="color:#8c8c8c;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Office</span><br>
             <span style="color:#1f1f1f;font-size:16px;">${office}</span>
           </div>
           <div>
             <span style="color:#8c8c8c;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Role</span><br>
             <span style="color:#1f1f1f;font-size:16px;">${roleLabel}</span>
           </div>
        </div>

        <p style="margin:0 0 24px;color:#595959;font-size:14px;">
           Please log in and change your password immediately.
        </p>

        <a href="${appUrl}/auth/login" style="display:inline-block;background:#003a70;color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:4px;font-weight:600;font-size:16px;">Log In Now</a>
      </div>

      <!-- Footer -->
      <div style="background:#fafafa;padding:24px;text-align:center;border-top:1px solid #f0f0f0;">
        <div style="color: #8c8c8c; font-size: 12px; line-height: 1.5;">
          <p style="margin: 0 0 8px;">
            <strong>${brandName}</strong><br>
            Dagupan City, Philippines
          </p>
          <p style="margin: 0;">
            Need help? <a href="mailto:${supportEmail}" style="color: #003a70; text-decoration: none;">Contact Support</a>
          </p>
          <p style="margin: 16px 0 0; font-size: 11px; color: #bfbfbf;">
            © ${new Date().getFullYear()} ${brandName}. All rights reserved.
          </p>
        </div>
      </div>

    </div>
  </div>
  </body>
  </html>
  `

  try {
    const fromAddress = from || process.env.DEFAULT_FROM_EMAIL || 'noreply@example.com'
    await sendEmailViaAPI({ to, from: fromAddress, subject, text, html })
  } catch (err) {
    console.log('--------------------------------------------------')
    console.log('⚠️  EMAIL API FAILED (Send Staff Credentials) ⚠️')
    console.log('To:', to)
    console.log('Username:', username)
    console.log('TempPass:', tempPassword)
    console.log('Error:', err.message)
    console.log('--------------------------------------------------')
  }
}

/**
 * Send email change notification
 * @param {object} options - Notification options
 * @param {string} options.to - Recipient email
 * @param {string} options.oldEmail - Old email address
 * @param {string} options.newEmail - New email address
 * @param {number} options.gracePeriodHours - Grace period in hours (default: 24)
 * @param {string} options.revertUrl - URL to revert email change
 * @param {string} options.type - 'old_email' or 'new_email'
 */
async function sendEmailChangeNotification({ to, oldEmail, newEmail, gracePeriodHours = 24, revertUrl, type = 'old_email', subject, from = process.env.DEFAULT_FROM_EMAIL || process.env.EMAIL_HOST_USER }) {
  const brandName = process.env.APP_BRAND_NAME || 'BizClear Business Center'
  const appUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:5173'
  const supportEmail = process.env.SUPPORT_EMAIL || process.env.EMAIL_HOST_USER || 'support@bizclear.com'
  
  const defaultSubject = type === 'old_email' 
    ? `Email Change Requested - ${brandName}`
    : `Welcome to ${brandName} - Email Change Confirmation`
  
  subject = subject || defaultSubject

  const isOldEmail = type === 'old_email'
  const text = [
    `Hello,`,
    '',
    isOldEmail 
      ? `We received a request to change the email address associated with your ${brandName} account.`
      : `Your email address has been updated for your ${brandName} account.`,
    '',
    `Old Email: ${oldEmail}`,
    `New Email: ${newEmail}`,
    '',
    isOldEmail
      ? `You have ${gracePeriodHours} hours to revert this change if you didn't request it.`
      : `If you didn't request this change, please contact support immediately.`,
    '',
    isOldEmail && revertUrl
      ? `Revert this change: ${revertUrl}`
      : '',
    '',
    `If you have any concerns, please contact support: ${supportEmail}`,
    '',
    'Thank you,',
    brandName
  ].filter(Boolean).join('\n')

  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://fonts.googleapis.com/css2?family=Raleway:wght@400;600;700&display=swap" rel="stylesheet">
  </head>
  <body style="margin:0;padding:0;font-family:'Raleway', sans-serif;">
  <div style="background:#f0f2f5;padding:40px 0;margin:0;font-family:'Raleway', sans-serif;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.08);overflow:hidden;">
      
      <!-- Header -->
      <div style="background:#003a70;padding:32px;text-align:center;">
        <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:1px;font-family:'Raleway', sans-serif;">${brandName}</h1>
      </div>

      <!-- Body -->
      <div style="padding:40px 32px;">
        <h2 style="margin:0 0 16px;font-size:22px;color:#1f1f1f;font-weight:700;font-family:'Raleway', sans-serif;">${isOldEmail ? 'Email Change Requested' : 'Email Change Confirmed'}</h2>
        
        <p style="margin:0 0 24px;color:#595959;font-size:16px;line-height:1.6;">
          ${isOldEmail 
            ? `We received a request to change the email address associated with your <strong>${brandName}</strong> account.`
            : `Your email address has been successfully updated for your <strong>${brandName}</strong> account.`
          }
        </p>

        <div style="background:#f8f9fa;padding:24px;border-radius:8px;border:1px solid #e8e8e8;margin-bottom:24px;">
          <div style="margin-bottom:12px;">
            <span style="color:#8c8c8c;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Old Email</span><br>
            <span style="color:#1f1f1f;font-size:16px;">${oldEmail}</span>
          </div>
          <div>
            <span style="color:#8c8c8c;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">New Email</span><br>
            <span style="color:#003a70;font-size:16px;font-weight:600;">${newEmail}</span>
          </div>
        </div>

        ${isOldEmail ? `
        <div style="background:#fffbe6;border:1px solid #ffe58f;padding:16px;border-radius:4px;margin-bottom:24px;">
          <p style="margin:0 0 8px;color:#d48806;font-weight:700;font-size:14px;">⏰ Grace Period</p>
          <p style="margin:0;color:#595959;font-size:14px;line-height:1.5;">
            You have <strong>${gracePeriodHours} hours</strong> to revert this change if you didn't request it.
            ${revertUrl ? `<a href="${revertUrl}" style="color:#d48806;text-decoration:underline;font-weight:600;display:block;margin-top:8px;">Revert Email Change</a>` : ''}
          </p>
        </div>
        ` : ''}

        <div style="background:#f0f5ff;border:1px solid #adc6ff;padding:16px;border-radius:4px;margin-bottom:24px;">
          <p style="margin:0 0 4px;color:#2f54eb;font-weight:700;font-size:14px;">${isOldEmail ? '⚠️' : '✅'} Important</p>
          <p style="margin:0;color:#595959;font-size:13px;line-height:1.5;">
            ${isOldEmail 
              ? 'If you didn\'t request this change, please revert it immediately or contact support.'
              : 'If you didn\'t request this change, please contact support immediately as your account may be at risk.'
            }
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div style="background:#fafafa;padding:24px;text-align:center;border-top:1px solid #f0f0f0;">
        <p style="margin:0 0 8px;color:#8c8c8c;font-size:12px;">
          Need help? <a href="mailto:${supportEmail}" style="color:#003a70;text-decoration:none;">Contact Support</a>
        </p>
        <p style="margin:16px 0 0;font-size:11px;color:#bfbfbf;">
          © ${new Date().getFullYear()} ${brandName}. All rights reserved.
        </p>
      </div>
    </div>
  </div>
  </body>
  </html>
  `

  try {
    const fromAddress = from || process.env.DEFAULT_FROM_EMAIL || 'noreply@example.com'
    await sendEmailViaAPI({ to, from: fromAddress, subject, text, html })
  } catch (err) {
    console.log('--------------------------------------------------')
    console.log('⚠️  EMAIL API FAILED (Email Change Notification) ⚠️')
    console.log('To:', to)
    console.log('Type:', type)
    console.log('Error:', err.message)
    console.log('--------------------------------------------------')
  }
}

/**
 * Send password change notification
 * @param {object} options - Notification options
 * @param {string} options.to - Recipient email
 * @param {string} options.firstName - User's first name
 * @param {string} options.lastName - User's last name
 * @param {Date} options.timestamp - When password was changed
 */
async function sendPasswordChangeNotification({ to, firstName, lastName, timestamp, subject, from = process.env.DEFAULT_FROM_EMAIL || process.env.EMAIL_HOST_USER }) {
  const brandName = process.env.APP_BRAND_NAME || 'BizClear Business Center'
  const appUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:5173'
  const supportEmail = process.env.SUPPORT_EMAIL || process.env.EMAIL_HOST_USER || 'support@bizclear.com'
  
  subject = subject || `Password Changed - ${brandName}`

  const changeTime = timestamp ? new Date(timestamp).toLocaleString() : new Date().toLocaleString()

  const text = [
    `Hello ${firstName},`,
    '',
    `Your password for ${brandName} has been successfully changed.`,
    '',
    `Change Time: ${changeTime}`,
    '',
    'If you didn\'t make this change, please contact support immediately.',
    '',
    `Support: ${supportEmail}`,
    '',
    'Thank you,',
    brandName
  ].join('\n')

  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://fonts.googleapis.com/css2?family=Raleway:wght@400;600;700&display=swap" rel="stylesheet">
  </head>
  <body style="margin:0;padding:0;font-family:'Raleway', sans-serif;">
  <div style="background:#f0f2f5;padding:40px 0;margin:0;font-family:'Raleway', sans-serif;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.08);overflow:hidden;">
      
      <!-- Header -->
      <div style="background:#003a70;padding:32px;text-align:center;">
        <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:1px;font-family:'Raleway', sans-serif;">${brandName}</h1>
      </div>

      <!-- Body -->
      <div style="padding:40px 32px;">
        <h2 style="margin:0 0 16px;font-size:22px;color:#1f1f1f;font-weight:700;font-family:'Raleway', sans-serif;">Password Changed Successfully</h2>
        
        <p style="margin:0 0 24px;color:#595959;font-size:16px;line-height:1.6;">
          Hello <strong>${firstName} ${lastName}</strong>,
        </p>

        <p style="margin:0 0 24px;color:#595959;font-size:16px;line-height:1.6;">
          Your password for <strong>${brandName}</strong> has been successfully changed.
        </p>

        <div style="background:#f8f9fa;padding:24px;border-radius:8px;border:1px solid #e8e8e8;margin-bottom:24px;">
          <div>
            <span style="color:#8c8c8c;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Change Time</span><br>
            <span style="color:#1f1f1f;font-size:16px;">${changeTime}</span>
          </div>
        </div>

        <div style="background:#fffbe6;border:1px solid #ffe58f;padding:16px;border-radius:4px;margin-bottom:24px;">
          <p style="margin:0 0 4px;color:#d48806;font-weight:700;font-size:14px;">⚠️ Security Notice</p>
          <p style="margin:0;color:#595959;font-size:13px;line-height:1.5;">
            If you didn't make this change, your account may be at risk. Please contact support immediately.
          </p>
        </div>

        <p style="margin:0;color:#595959;font-size:14px;">
          All active sessions have been invalidated for security. You'll need to log in again with your new password.
        </p>
      </div>

      <!-- Footer -->
      <div style="background:#fafafa;padding:24px;text-align:center;border-top:1px solid #f0f0f0;">
        <p style="margin:0 0 8px;color:#8c8c8c;font-size:12px;">
          Need help? <a href="mailto:${supportEmail}" style="color:#003a70;text-decoration:none;">Contact Support</a>
        </p>
        <p style="margin:16px 0 0;font-size:11px;color:#bfbfbf;">
          © ${new Date().getFullYear()} ${brandName}. All rights reserved.
        </p>
      </div>
    </div>
  </div>
  </body>
  </html>
  `

  try {
    const fromAddress = from || process.env.DEFAULT_FROM_EMAIL || 'noreply@example.com'
    await sendEmailViaAPI({ to, from: fromAddress, subject, text, html })
  } catch (err) {
    console.log('--------------------------------------------------')
    console.log('⚠️  EMAIL API FAILED (Password Change Notification) ⚠️')
    console.log('To:', to)
    console.log('Error:', err.message)
    console.log('--------------------------------------------------')
  }
}

/**
 * Send MFA enabled notification (authenticator app or passkey)
 * @param {object} options - Notification options
 * @param {string} options.to - Recipient email
 * @param {string} options.firstName - User's first name
 * @param {string} options.lastName - User's last name
 * @param {string} options.method - 'authenticator' or 'passkey'
 */
async function sendMfaEnabledNotification({ to, firstName, lastName, method = 'authenticator', subject, from = process.env.DEFAULT_FROM_EMAIL || process.env.EMAIL_HOST_USER }) {
  const brandName = process.env.APP_BRAND_NAME || 'BizClear Business Center'
  const supportEmail = process.env.SUPPORT_EMAIL || process.env.EMAIL_HOST_USER || 'support@bizclear.com'

  subject = subject || `Two-Factor Authentication Enabled - ${brandName}`
  const methodLabel = method === 'passkey' ? 'passkey (e.g. Face ID, Windows Hello)' : 'authenticator app'

  const text = [
    `Hello ${firstName},`,
    '',
    `Two-factor authentication has been enabled for your ${brandName} account using ${methodLabel}.`,
    '',
    'You will need this method when signing in. If you didn\'t make this change, please contact support immediately.',
    '',
    `Support: ${supportEmail}`,
    '',
    'Thank you,',
    brandName
  ].join('\n')

  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://fonts.googleapis.com/css2?family=Raleway:wght@400;600;700&display=swap" rel="stylesheet">
  </head>
  <body style="margin:0;padding:0;font-family:'Raleway', sans-serif;">
  <div style="background:#f0f2f5;padding:40px 0;margin:0;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.08);overflow:hidden;">
      <div style="background:#003a70;padding:32px;text-align:center;">
        <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;font-family:'Raleway', sans-serif;">${brandName}</h1>
      </div>
      <div style="padding:40px 32px;">
        <h2 style="margin:0 0 16px;font-size:22px;color:#1f1f1f;font-weight:700;">Two-Factor Authentication Enabled</h2>
        <p style="margin:0 0 24px;color:#595959;font-size:16px;line-height:1.6;">
          Hello <strong>${firstName} ${lastName}</strong>,
        </p>
        <p style="margin:0 0 24px;color:#595959;font-size:16px;line-height:1.6;">
          Two-factor authentication has been enabled for your <strong>${brandName}</strong> account using <strong>${methodLabel}</strong>.
        </p>
        <div style="background:#f6ffed;border:1px solid #b7eb8f;padding:16px;border-radius:4px;margin-bottom:24px;">
          <p style="margin:0;color:#389e0d;font-size:14px;">You will need this method when signing in.</p>
        </div>
        <p style="margin:0;color:#595959;font-size:13px;">If you didn't make this change, please contact support immediately.</p>
      </div>
      <div style="background:#fafafa;padding:24px;text-align:center;border-top:1px solid #f0f0f0;">
        <p style="margin:0;font-size:12px;color:#8c8c8c;">Need help? <a href="mailto:${supportEmail}" style="color:#003a70;">Contact Support</a></p>
      </div>
    </div>
  </div>
  </body>
  </html>
  `

  try {
    const fromAddress = from || process.env.DEFAULT_FROM_EMAIL || 'noreply@example.com'
    await sendEmailViaAPI({ to, from: fromAddress, subject, text, html })
  } catch (err) {
    console.log('--------------------------------------------------')
    console.log('⚠️  EMAIL API FAILED (MFA Enabled Notification) ⚠️')
    console.log('To:', to, 'Error:', err.message)
    console.log('--------------------------------------------------')
  }
}

/**
 * Send MFA disable requested notification (24-hour delay)
 * @param {object} options - Notification options
 * @param {string} options.to - Recipient email
 * @param {string} options.firstName - User's first name
 * @param {string} options.lastName - User's last name
 * @param {Date} options.scheduledFor - When MFA will be disabled
 */
async function sendMfaDisableRequestedNotification({ to, firstName, lastName, scheduledFor, subject, from = process.env.DEFAULT_FROM_EMAIL || process.env.EMAIL_HOST_USER }) {
  const brandName = process.env.APP_BRAND_NAME || 'BizClear Business Center'
  const supportEmail = process.env.SUPPORT_EMAIL || process.env.EMAIL_HOST_USER || 'support@bizclear.com'

  subject = subject || `MFA Disable Requested - ${brandName}`
  const disableTime = scheduledFor ? new Date(scheduledFor).toLocaleString() : 'in 24 hours'

  const text = [
    `Hello ${firstName},`,
    '',
    `A request to disable two-factor authentication for your ${brandName} account has been received.`,
    '',
    `MFA will be disabled on: ${disableTime}`,
    '',
    'You can cancel this request from your security settings before that time. If you didn\'t request this, please secure your account and contact support.',
    '',
    `Support: ${supportEmail}`,
    '',
    'Thank you,',
    brandName
  ].join('\n')

  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://fonts.googleapis.com/css2?family=Raleway:wght@400;600;700&display=swap" rel="stylesheet">
  </head>
  <body style="margin:0;padding:0;font-family:'Raleway', sans-serif;">
  <div style="background:#f0f2f5;padding:40px 0;margin:0;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.08);overflow:hidden;">
      <div style="background:#003a70;padding:32px;text-align:center;">
        <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;font-family:'Raleway', sans-serif;">${brandName}</h1>
      </div>
      <div style="padding:40px 32px;">
        <h2 style="margin:0 0 16px;font-size:22px;color:#1f1f1f;font-weight:700;">MFA Disable Requested</h2>
        <p style="margin:0 0 24px;color:#595959;font-size:16px;line-height:1.6;">
          Hello <strong>${firstName} ${lastName}</strong>,
        </p>
        <p style="margin:0 0 24px;color:#595959;font-size:16px;line-height:1.6;">
          A request to disable two-factor authentication for your <strong>${brandName}</strong> account has been received.
        </p>
        <div style="background:#f8f9fa;padding:24px;border-radius:8px;border:1px solid #e8e8e8;margin-bottom:24px;">
          <span style="color:#8c8c8c;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Scheduled disable time</span><br>
          <span style="color:#1f1f1f;font-size:16px;">${disableTime}</span>
        </div>
        <p style="margin:0;color:#595959;font-size:13px;">You can cancel this request from your security settings before that time. If you didn't request this, please secure your account and contact support.</p>
      </div>
      <div style="background:#fafafa;padding:24px;text-align:center;border-top:1px solid #f0f0f0;">
        <p style="margin:0;font-size:12px;color:#8c8c8c;">Need help? <a href="mailto:${supportEmail}" style="color:#003a70;">Contact Support</a></p>
      </div>
    </div>
  </div>
  </body>
  </html>
  `

  try {
    const fromAddress = from || process.env.DEFAULT_FROM_EMAIL || 'noreply@example.com'
    await sendEmailViaAPI({ to, from: fromAddress, subject, text, html })
  } catch (err) {
    console.log('--------------------------------------------------')
    console.log('⚠️  EMAIL API FAILED (MFA Disable Requested Notification) ⚠️')
    console.log('To:', to, 'Error:', err.message)
    console.log('--------------------------------------------------')
  }
}

/**
 * Send MFA disabled notification (after disable completed)
 * @param {object} options - Notification options
 * @param {string} options.to - Recipient email
 * @param {string} options.firstName - User's first name
 * @param {string} options.lastName - User's last name
 */
async function sendMfaDisabledNotification({ to, firstName, lastName, subject, from = process.env.DEFAULT_FROM_EMAIL || process.env.EMAIL_HOST_USER }) {
  const brandName = process.env.APP_BRAND_NAME || 'BizClear Business Center'
  const supportEmail = process.env.SUPPORT_EMAIL || process.env.EMAIL_HOST_USER || 'support@bizclear.com'

  subject = subject || `Two-Factor Authentication Disabled - ${brandName}`

  const text = [
    `Hello ${firstName},`,
    '',
    `Two-factor authentication has been disabled for your ${brandName} account.`,
    '',
    'If you didn\'t make this change, please contact support immediately and re-enable MFA from your security settings.',
    '',
    `Support: ${supportEmail}`,
    '',
    'Thank you,',
    brandName
  ].join('\n')

  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://fonts.googleapis.com/css2?family=Raleway:wght@400;600;700&display=swap" rel="stylesheet">
  </head>
  <body style="margin:0;padding:0;font-family:'Raleway', sans-serif;">
  <div style="background:#f0f2f5;padding:40px 0;margin:0;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.08);overflow:hidden;">
      <div style="background:#003a70;padding:32px;text-align:center;">
        <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;font-family:'Raleway', sans-serif;">${brandName}</h1>
      </div>
      <div style="padding:40px 32px;">
        <h2 style="margin:0 0 16px;font-size:22px;color:#1f1f1f;font-weight:700;">Two-Factor Authentication Disabled</h2>
        <p style="margin:0 0 24px;color:#595959;font-size:16px;line-height:1.6;">
          Hello <strong>${firstName} ${lastName}</strong>,
        </p>
        <p style="margin:0 0 24px;color:#595959;font-size:16px;line-height:1.6;">
          Two-factor authentication has been disabled for your <strong>${brandName}</strong> account.
        </p>
        <p style="margin:0;color:#595959;font-size:13px;">If you didn't make this change, please contact support immediately and re-enable MFA from your security settings.</p>
      </div>
      <div style="background:#fafafa;padding:24px;text-align:center;border-top:1px solid #f0f0f0;">
        <p style="margin:0;font-size:12px;color:#8c8c8c;">Need help? <a href="mailto:${supportEmail}" style="color:#003a70;">Contact Support</a></p>
      </div>
    </div>
  </div>
  </body>
  </html>
  `

  try {
    const fromAddress = from || process.env.DEFAULT_FROM_EMAIL || 'noreply@example.com'
    await sendEmailViaAPI({ to, from: fromAddress, subject, text, html })
  } catch (err) {
    console.log('--------------------------------------------------')
    console.log('⚠️  EMAIL API FAILED (MFA Disabled Notification) ⚠️')
    console.log('To:', to, 'Error:', err.message)
    console.log('--------------------------------------------------')
  }
}

/**
 * Send passkey added notification
 * @param {object} options - Notification options
 * @param {string} options.to - Recipient email
 * @param {string} options.firstName - User's first name
 * @param {string} options.lastName - User's last name
 */
async function sendPasskeyAddedNotification({ to, firstName, lastName, subject, from = process.env.DEFAULT_FROM_EMAIL || process.env.EMAIL_HOST_USER }) {
  const brandName = process.env.APP_BRAND_NAME || 'BizClear Business Center'
  const supportEmail = process.env.SUPPORT_EMAIL || process.env.EMAIL_HOST_USER || 'support@bizclear.com'

  subject = subject || `Passkey Added - ${brandName}`

  const text = [
    `Hello ${firstName},`,
    '',
    `A passkey has been added to your ${brandName} account. You can use it to sign in (e.g. Face ID, Windows Hello).`,
    '',
    'If you didn\'t add this passkey, please remove it from security settings and contact support.',
    '',
    `Support: ${supportEmail}`,
    '',
    'Thank you,',
    brandName
  ].join('\n')

  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://fonts.googleapis.com/css2?family=Raleway:wght@400;600;700&display=swap" rel="stylesheet">
  </head>
  <body style="margin:0;padding:0;font-family:'Raleway', sans-serif;">
  <div style="background:#f0f2f5;padding:40px 0;margin:0;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.08);overflow:hidden;">
      <div style="background:#003a70;padding:32px;text-align:center;">
        <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;font-family:'Raleway', sans-serif;">${brandName}</h1>
      </div>
      <div style="padding:40px 32px;">
        <h2 style="margin:0 0 16px;font-size:22px;color:#1f1f1f;font-weight:700;">Passkey Added</h2>
        <p style="margin:0 0 24px;color:#595959;font-size:16px;line-height:1.6;">
          Hello <strong>${firstName} ${lastName}</strong>,
        </p>
        <p style="margin:0 0 24px;color:#595959;font-size:16px;line-height:1.6;">
          A passkey has been added to your <strong>${brandName}</strong> account. You can use it to sign in (e.g. Face ID, Windows Hello).
        </p>
        <p style="margin:0;color:#595959;font-size:13px;">If you didn't add this passkey, please remove it from security settings and contact support.</p>
      </div>
      <div style="background:#fafafa;padding:24px;text-align:center;border-top:1px solid #f0f0f0;">
        <p style="margin:0;font-size:12px;color:#8c8c8c;">Need help? <a href="mailto:${supportEmail}" style="color:#003a70;">Contact Support</a></p>
      </div>
    </div>
  </div>
  </body>
  </html>
  `

  try {
    const fromAddress = from || process.env.DEFAULT_FROM_EMAIL || 'noreply@example.com'
    await sendEmailViaAPI({ to, from: fromAddress, subject, text, html })
  } catch (err) {
    console.log('--------------------------------------------------')
    console.log('⚠️  EMAIL API FAILED (Passkey Added Notification) ⚠️')
    console.log('To:', to, 'Error:', err.message)
    console.log('--------------------------------------------------')
  }
}

/**
 * Send passkey removed notification
 * @param {object} options - Notification options
 * @param {string} options.to - Recipient email
 * @param {string} options.firstName - User's first name
 * @param {string} options.lastName - User's last name
 */
async function sendPasskeyRemovedNotification({ to, firstName, lastName, subject, from = process.env.DEFAULT_FROM_EMAIL || process.env.EMAIL_HOST_USER }) {
  const brandName = process.env.APP_BRAND_NAME || 'BizClear Business Center'
  const supportEmail = process.env.SUPPORT_EMAIL || process.env.EMAIL_HOST_USER || 'support@bizclear.com'

  subject = subject || `Passkey Removed - ${brandName}`

  const text = [
    `Hello ${firstName},`,
    '',
    `A passkey has been removed from your ${brandName} account.`,
    '',
    'If you didn\'t make this change, please contact support and consider re-adding a passkey or enabling an authenticator app from security settings.',
    '',
    `Support: ${supportEmail}`,
    '',
    'Thank you,',
    brandName
  ].join('\n')

  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://fonts.googleapis.com/css2?family=Raleway:wght@400;600;700&display=swap" rel="stylesheet">
  </head>
  <body style="margin:0;padding:0;font-family:'Raleway', sans-serif;">
  <div style="background:#f0f2f5;padding:40px 0;margin:0;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.08);overflow:hidden;">
      <div style="background:#003a70;padding:32px;text-align:center;">
        <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;font-family:'Raleway', sans-serif;">${brandName}</h1>
      </div>
      <div style="padding:40px 32px;">
        <h2 style="margin:0 0 16px;font-size:22px;color:#1f1f1f;font-weight:700;">Passkey Removed</h2>
        <p style="margin:0 0 24px;color:#595959;font-size:16px;line-height:1.6;">
          Hello <strong>${firstName} ${lastName}</strong>,
        </p>
        <p style="margin:0 0 24px;color:#595959;font-size:16px;line-height:1.6;">
          A passkey has been removed from your <strong>${brandName}</strong> account.
        </p>
        <p style="margin:0;color:#595959;font-size:13px;">If you didn't make this change, please contact support and consider re-adding a passkey or enabling an authenticator app from security settings.</p>
      </div>
      <div style="background:#fafafa;padding:24px;text-align:center;border-top:1px solid #f0f0f0;">
        <p style="margin:0;font-size:12px;color:#8c8c8c;">Need help? <a href="mailto:${supportEmail}" style="color:#003a70;">Contact Support</a></p>
      </div>
    </div>
  </div>
  </body>
  </html>
  `

  try {
    const fromAddress = from || process.env.DEFAULT_FROM_EMAIL || 'noreply@example.com'
    await sendEmailViaAPI({ to, from: fromAddress, subject, text, html })
  } catch (err) {
    console.log('--------------------------------------------------')
    console.log('⚠️  EMAIL API FAILED (Passkey Removed Notification) ⚠️')
    console.log('To:', to, 'Error:', err.message)
    console.log('--------------------------------------------------')
  }
}

/**
 * Send admin alert email
 * @param {object} options - Alert options
 * @param {string} options.to - Admin email
 * @param {string} options.adminName - Admin name
 * @param {string} options.userId - User ID who attempted change
 * @param {string} options.userName - User name
 * @param {string} options.userEmail - User email
 * @param {string} options.field - Field attempted
 * @param {string} options.attemptedValue - Value attempted
 * @param {string} options.roleSlug - User role
 * @param {Date} options.timestamp - When attempt occurred
 */
async function sendAdminAlertEmail({ to, adminName, userId, userName, userEmail, field, attemptedValue, roleSlug, timestamp, subject, from = process.env.DEFAULT_FROM_EMAIL || process.env.EMAIL_HOST_USER }) {
  const brandName = process.env.APP_BRAND_NAME || 'BizClear Business Center'
  const appUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:5173'
  
  subject = subject || `🚨 Security Alert: Restricted Field Attempt - ${brandName}`

  const attemptTime = timestamp ? new Date(timestamp).toLocaleString() : new Date().toLocaleString()

  const text = [
    `Hello ${adminName},`,
    '',
    'SECURITY ALERT: A staff user attempted to modify a restricted field.',
    '',
    `User: ${userName} (${userEmail})`,
    `Role: ${roleSlug}`,
    `Field Attempted: ${field}`,
    `Attempted Value: ${attemptedValue}`,
    `Time: ${attemptTime}`,
    '',
    'Please review this attempt and take appropriate action.',
    '',
    `View audit logs: ${appUrl}/admin/audit`,
    '',
    brandName
  ].join('\n')

  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://fonts.googleapis.com/css2?family=Raleway:wght@400;600;700&display=swap" rel="stylesheet">
  </head>
  <body style="margin:0;padding:0;font-family:'Raleway', sans-serif;">
  <div style="background:#f0f2f5;padding:40px 0;margin:0;font-family:'Raleway', sans-serif;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.08);overflow:hidden;">
      
      <!-- Header -->
      <div style="background:#ff4d4f;padding:32px;text-align:center;">
        <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:1px;font-family:'Raleway', sans-serif;">🚨 Security Alert</h1>
      </div>

      <!-- Body -->
      <div style="padding:40px 32px;">
        <h2 style="margin:0 0 16px;font-size:22px;color:#1f1f1f;font-weight:700;font-family:'Raleway', sans-serif;">Restricted Field Attempt</h2>
        
        <p style="margin:0 0 24px;color:#595959;font-size:16px;line-height:1.6;">
          Hello <strong>${adminName}</strong>,
        </p>

        <p style="margin:0 0 24px;color:#595959;font-size:16px;line-height:1.6;">
          A staff user has attempted to modify a restricted field. This action has been blocked and logged.
        </p>

        <div style="background:#fff1f0;border:1px solid #ffccc7;padding:24px;border-radius:8px;margin-bottom:24px;">
          <div style="margin-bottom:12px;">
            <span style="color:#8c8c8c;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">User</span><br>
            <span style="color:#1f1f1f;font-size:16px;font-weight:600;">${userName}</span><br>
            <span style="color:#8c8c8c;font-size:14px;">${userEmail}</span>
          </div>
          <div style="margin-bottom:12px;">
            <span style="color:#8c8c8c;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Role</span><br>
            <span style="color:#1f1f1f;font-size:16px;">${roleSlug}</span>
          </div>
          <div style="margin-bottom:12px;">
            <span style="color:#8c8c8c;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Field Attempted</span><br>
            <span style="color:#ff4d4f;font-size:16px;font-weight:600;">${field}</span>
          </div>
          <div style="margin-bottom:12px;">
            <span style="color:#8c8c8c;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Attempted Value</span><br>
            <span style="color:#1f1f1f;font-size:14px;font-family:monospace;word-break:break-all;">${attemptedValue}</span>
          </div>
          <div>
            <span style="color:#8c8c8c;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Time</span><br>
            <span style="color:#1f1f1f;font-size:14px;">${attemptTime}</span>
          </div>
        </div>

        <a href="${appUrl}/admin/audit" style="display:inline-block;background:#ff4d4f;color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:4px;font-weight:600;font-size:16px;">View Audit Logs</a>
      </div>

      <!-- Footer -->
      <div style="background:#fafafa;padding:24px;text-align:center;border-top:1px solid #f0f0f0;">
        <p style="margin:0 0 8px;color:#8c8c8c;font-size:12px;">
          <strong>${brandName}</strong> Security Team
        </p>
        <p style="margin:16px 0 0;font-size:11px;color:#bfbfbf;">
          © ${new Date().getFullYear()} ${brandName}. All rights reserved.
        </p>
      </div>
    </div>
  </div>
  </body>
  </html>
  `

  try {
    const fromAddress = from || process.env.DEFAULT_FROM_EMAIL || 'noreply@example.com'
    await sendEmailViaAPI({ to, from: fromAddress, subject, text, html })
  } catch (err) {
    console.log('--------------------------------------------------')
    console.log('⚠️  EMAIL API FAILED (Admin Alert Email) ⚠️')
    console.log('To:', to)
    console.log('Error:', err.message)
    console.log('--------------------------------------------------')
  }
}

/**
 * Send admin alert for staff or admin forgot-password attempt (styled like other security alerts).
 * @param {object} options - { to, adminName, userId, userEmail, roleSlug, ipAddress, userAgent }
 */
async function sendStaffOrAdminForgotPasswordAlertEmail({ to, adminName, userId, userEmail, roleSlug, ipAddress, userAgent, subject, from = process.env.DEFAULT_FROM_EMAIL || process.env.EMAIL_HOST_USER }) {
  const brandName = process.env.APP_BRAND_NAME || 'BizClear Business Center'
  const appUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:5173'

  subject = subject || `Security Alert: Forgot password attempt (staff/admin) - ${brandName}`

  const attemptTime = new Date().toLocaleString()
  const roleLabel = (roleSlug || 'unknown').replace(/_/g, ' ')

  const text = [
    `Hello ${adminName},`,
    '',
    'SECURITY ALERT: A staff or admin account was used on the Forgot Password page. Password reset is not allowed for this account type; the attempt has been logged.',
    '',
    `Account: ${userEmail}`,
    `Role: ${roleLabel}`,
    `IP Address: ${ipAddress || '—'}`,
    `User-Agent: ${userAgent || '—'}`,
    `Time: ${attemptTime}`,
    '',
    'Please review this in the Security page if needed.',
    '',
    `Security page: ${appUrl}/admin/security`,
    '',
    brandName,
  ].join('\n')

  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://fonts.googleapis.com/css2?family=Raleway:wght@400;600;700&display=swap" rel="stylesheet">
  </head>
  <body style="margin:0;padding:0;font-family:'Raleway', sans-serif;">
  <div style="background:#f0f2f5;padding:40px 0;margin:0;font-family:'Raleway', sans-serif;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.08);overflow:hidden;">
      <div style="background:#ff4d4f;padding:32px;text-align:center;">
        <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:1px;font-family:'Raleway', sans-serif;">Security Alert</h1>
      </div>
      <div style="padding:40px 32px;">
        <h2 style="margin:0 0 16px;font-size:22px;color:#1f1f1f;font-weight:700;font-family:'Raleway', sans-serif;">Forgot password attempt (staff/admin)</h2>
        <p style="margin:0 0 24px;color:#595959;font-size:16px;line-height:1.6;">
          Hello <strong>${adminName}</strong>,
        </p>
        <p style="margin:0 0 24px;color:#595959;font-size:16px;line-height:1.6;">
          A staff or admin account was used on the Forgot Password page. Password reset is not allowed for this account type. This action has been logged and an incident has been recorded.
        </p>
        <div style="background:#fff1f0;border:1px solid #ffccc7;padding:24px;border-radius:8px;margin-bottom:24px;">
          <div style="margin-bottom:12px;">
            <span style="color:#8c8c8c;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Account</span><br>
            <span style="color:#1f1f1f;font-size:16px;font-weight:600;">${userEmail || '—'}</span>
          </div>
          <div style="margin-bottom:12px;">
            <span style="color:#8c8c8c;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Role</span><br>
            <span style="color:#1f1f1f;font-size:16px;">${roleLabel}</span>
          </div>
          <div style="margin-bottom:12px;">
            <span style="color:#8c8c8c;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">IP Address</span><br>
            <span style="color:#1f1f1f;font-size:14px;font-family:monospace;">${ipAddress || '—'}</span>
          </div>
          <div style="margin-bottom:12px;">
            <span style="color:#8c8c8c;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">User-Agent</span><br>
            <span style="color:#595959;font-size:13px;line-height:1.4;word-break:break-all;">${userAgent || '—'}</span>
          </div>
          <div>
            <span style="color:#8c8c8c;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Time</span><br>
            <span style="color:#1f1f1f;font-size:14px;">${attemptTime}</span>
          </div>
        </div>
        <a href="${appUrl}/admin/security" style="display:inline-block;background:#ff4d4f;color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:4px;font-weight:600;font-size:16px;">View Security Page</a>
      </div>
      <div style="background:#fafafa;padding:24px;text-align:center;border-top:1px solid #f0f0f0;">
        <p style="margin:0 0 8px;color:#8c8c8c;font-size:12px;"><strong>${brandName}</strong> Security Team</p>
        <p style="margin:16px 0 0;font-size:11px;color:#bfbfbf;">© ${new Date().getFullYear()} ${brandName}. All rights reserved.</p>
      </div>
    </div>
  </div>
  </body>
  </html>
  `

  try {
    const fromAddress = from || process.env.DEFAULT_FROM_EMAIL || 'noreply@example.com'
    await sendEmailViaAPI({ to, from: fromAddress, subject, text, html })
  } catch (err) {
    console.log('--------------------------------------------------')
    console.log('⚠️  EMAIL API FAILED (Staff/Admin Forgot Password Alert) ⚠️')
    console.log('To:', to, 'Error:', err.message)
    console.log('--------------------------------------------------')
  }
}

/**
 * Send generic admin alert (suspicious activity, recovery/deletion from unusual IP, etc.)
 * @param {object} options - { to, adminName, type, data }
 */
async function sendAdminAlert({ to, adminName, type, data = {} }) {
  // Use dedicated template for staff/admin forgot-password attempt
  if (type === 'staff_or_admin_forgot_password_attempted') {
    return sendStaffOrAdminForgotPasswordAlertEmail({
      to,
      adminName,
      userId: data.userId,
      userEmail: data.userEmail,
      roleSlug: data.roleSlug,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    })
  }

  const brandName = process.env.APP_BRAND_NAME || 'BizClear Business Center'
  const appUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:5173'
  const subject = `Security Alert: ${type} - ${brandName}`
  const dataStr = typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data)
  const text = [
    `Hello ${adminName},`,
    '',
    `Security alert (${type}):`,
    '',
    dataStr,
    '',
    `Dashboard: ${appUrl}/admin`,
    '',
    brandName,
  ].join('\n')
  const html = `
  <!DOCTYPE html><html><body style="font-family:sans-serif;">
  <h2>Security Alert: ${type}</h2>
  <p>Hello ${adminName},</p>
  <pre style="background:#f5f5f5;padding:12px;border-radius:4px;">${dataStr}</pre>
  <p><a href="${appUrl}/admin">Open Admin Dashboard</a></p>
  <p style="color:#8c8c8c;">${brandName}</p>
  </body></html>
  `
  try {
    const from = process.env.DEFAULT_FROM_EMAIL || 'noreply@example.com'
    await sendEmailViaAPI({ to, from, subject, text, html })
  } catch (err) {
    console.log('--------------------------------------------------')
    console.log('⚠️  EMAIL API FAILED (Admin Alert) ⚠️')
    console.log('To:', to, 'Error:', err.message)
    console.log('--------------------------------------------------')
  }
}

/**
 * Send approval notification
 * @param {object} options - Notification options
 * @param {string} options.to - Admin email
 * @param {string} options.adminName - Admin name
 * @param {string} options.approvalId - Approval ID
 * @param {string} options.status - 'approved' or 'rejected'
 * @param {string} options.requestType - Type of request
 * @param {string} options.comment - Approver comment
 * @param {string} options.approverName - Name of approver
 * @param {Date} options.timestamp - When approval occurred
 */
async function sendApprovalNotification({ to, adminName, approvalId, status, requestType, comment, approverName, timestamp, subject, from = process.env.DEFAULT_FROM_EMAIL || process.env.EMAIL_HOST_USER }) {
  const brandName = process.env.APP_BRAND_NAME || 'BizClear Business Center'
  const appUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:5173'
  
  const statusText = status === 'approved' ? 'Approved' : 'Rejected'
  subject = subject || `Approval Request ${statusText} - ${brandName}`

  const approvalTime = timestamp ? new Date(timestamp).toLocaleString() : new Date().toLocaleString()

  const text = [
    `Hello ${adminName},`,
    '',
    `Your approval request has been ${statusText.toLowerCase()}.`,
    '',
    `Approval ID: ${approvalId}`,
    `Request Type: ${requestType}`,
    `Status: ${statusText}`,
    `Approved by: ${approverName}`,
    `Time: ${approvalTime}`,
    comment ? `Comment: ${comment}` : '',
    '',
    status === 'approved' 
      ? 'Your requested changes have been applied.'
      : 'Your requested changes have been rejected.',
    '',
    `View details: ${appUrl}/admin/approvals/${approvalId}`,
    '',
    brandName
  ].filter(Boolean).join('\n')

  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://fonts.googleapis.com/css2?family=Raleway:wght@400;600;700&display=swap" rel="stylesheet">
  </head>
  <body style="margin:0;padding:0;font-family:'Raleway', sans-serif;">
  <div style="background:#f0f2f5;padding:40px 0;margin:0;font-family:'Raleway', sans-serif;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.08);overflow:hidden;">
      
      <!-- Header -->
      <div style="background:${status === 'approved' ? '#52c41a' : '#ff4d4f'};padding:32px;text-align:center;">
        <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:1px;font-family:'Raleway', sans-serif;">${status === 'approved' ? '✅' : '❌'} Request ${statusText}</h1>
      </div>

      <!-- Body -->
      <div style="padding:40px 32px;">
        <h2 style="margin:0 0 16px;font-size:22px;color:#1f1f1f;font-weight:700;font-family:'Raleway', sans-serif;">Approval Request ${statusText}</h2>
        
        <p style="margin:0 0 24px;color:#595959;font-size:16px;line-height:1.6;">
          Hello <strong>${adminName}</strong>,
        </p>

        <p style="margin:0 0 24px;color:#595959;font-size:16px;line-height:1.6;">
          Your approval request has been <strong>${statusText.toLowerCase()}</strong>${status === 'approved' ? ' and your requested changes have been applied.' : '.'}
        </p>

        <div style="background:#f8f9fa;padding:24px;border-radius:8px;border:1px solid #e8e8e8;margin-bottom:24px;">
          <div style="margin-bottom:12px;">
            <span style="color:#8c8c8c;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Approval ID</span><br>
            <span style="color:#1f1f1f;font-size:16px;font-family:monospace;">${approvalId}</span>
          </div>
          <div style="margin-bottom:12px;">
            <span style="color:#8c8c8c;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Request Type</span><br>
            <span style="color:#1f1f1f;font-size:16px;">${requestType}</span>
          </div>
          <div style="margin-bottom:12px;">
            <span style="color:#8c8c8c;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Status</span><br>
            <span style="color:${status === 'approved' ? '#52c41a' : '#ff4d4f'};font-size:16px;font-weight:600;">${statusText}</span>
          </div>
          <div style="margin-bottom:12px;">
            <span style="color:#8c8c8c;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Approved By</span><br>
            <span style="color:#1f1f1f;font-size:16px;">${approverName}</span>
          </div>
          ${comment ? `
          <div>
            <span style="color:#8c8c8c;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Comment</span><br>
            <span style="color:#595959;font-size:14px;line-height:1.5;">${comment}</span>
          </div>
          ` : ''}
          <div style="margin-top:12px;padding-top:12px;border-top:1px solid #e8e8e8;">
            <span style="color:#8c8c8c;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Time</span><br>
            <span style="color:#8c8c8c;font-size:14px;">${approvalTime}</span>
          </div>
        </div>

        <a href="${appUrl}/admin/approvals/${approvalId}" style="display:inline-block;background:#003a70;color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:4px;font-weight:600;font-size:16px;">View Details</a>
      </div>

      <!-- Footer -->
      <div style="background:#fafafa;padding:24px;text-align:center;border-top:1px solid #f0f0f0;">
        <p style="margin:0 0 8px;color:#8c8c8c;font-size:12px;">
          <strong>${brandName}</strong>
        </p>
        <p style="margin:16px 0 0;font-size:11px;color:#bfbfbf;">
          © ${new Date().getFullYear()} ${brandName}. All rights reserved.
        </p>
      </div>
    </div>
  </div>
  </body>
  </html>
  `

  try {
    const fromAddress = from || process.env.DEFAULT_FROM_EMAIL || 'noreply@example.com'
    await sendEmailViaAPI({ to, from: fromAddress, subject, text, html })
  } catch (err) {
    console.log('--------------------------------------------------')
    console.log('⚠️  EMAIL API FAILED (Approval Notification) ⚠️')
    console.log('To:', to)
    console.log('Error:', err.message)
    console.log('--------------------------------------------------')
  }
}

module.exports = {
  sendOtp,
  sendForgotPasswordNotAvailableEmail,
  sendStaffCredentialsEmail,
  sendEmailChangeNotification,
  sendPasswordChangeNotification,
  sendMfaEnabledNotification,
  sendMfaDisableRequestedNotification,
  sendMfaDisabledNotification,
  sendPasskeyAddedNotification,
  sendPasskeyRemovedNotification,
  sendAdminAlertEmail,
  sendAdminAlert,
  sendApprovalNotification,
}
