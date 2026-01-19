const axios = require('axios')

/**
 * Email API Service - REST API Implementation
 * Supports multiple providers: SendGrid, Mailgun, AWS SES, Resend, Postmark
 * Default: SendGrid (recommended for capstone)
 */

// Helper function to create mock email sender (for development)
function createMockEmailSender() {
  return async (opts) => {
    console.log('📧 [MOCK EMAIL] To:', opts.to)
    console.log('Subject:', opts.subject)
    const codeMatch = opts.html?.match(/(\d{6})/) || opts.text?.match(/(\d{6})/)
    if (codeMatch) {
      console.log('📧 [MOCK EMAIL] OTP Code:', codeMatch[1])
    }
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
  const provider = process.env.EMAIL_API_PROVIDER || 'sendgrid'
  const apiKey = process.env.EMAIL_API_KEY
  const apiUrl = process.env.EMAIL_API_URL
  const isDevelopment = process.env.NODE_ENV !== 'production'

  // If no API key in development, use mock
  if (!apiKey && isDevelopment) {
    console.warn('⚠️ Email API key not configured. Using mock email sender in development.')
    const mockSender = createMockEmailSender()
    return await mockSender({ to, subject, text, html })
  }

  if (!apiKey) {
    throw new Error('EMAIL_API_KEY is required. Set EMAIL_API_KEY in environment variables.')
  }

  try {
    switch (provider.toLowerCase()) {
      case 'sendgrid':
        return await sendViaSendGrid({ to, from, subject, text, html, headers, apiKey, apiUrl })
      case 'mailgun':
        return await sendViaMailgun({ to, from, subject, text, html, headers, apiKey, apiUrl })
      case 'ses':
      case 'aws-ses':
        return await sendViaAWSSES({ to, from, subject, text, html, headers, apiKey, apiUrl })
      case 'resend':
        return await sendViaResend({ to, from, subject, text, html, headers, apiKey, apiUrl })
      case 'postmark':
        return await sendViaPostmark({ to, from, subject, text, html, headers, apiKey, apiUrl })
      default:
        throw new Error(`Unsupported email provider: ${provider}. Supported: sendgrid, mailgun, ses, resend, postmark`)
    }
  } catch (err) {
    // In development, fall back to mock on API errors
    if (isDevelopment && err.response) {
      console.warn('⚠️ Email API error. Falling back to mock email sender in development.')
      console.warn('Error:', err.message)
      const mockSender = createMockEmailSender()
      return await mockSender({ to, subject, text, html })
    }
    throw err
  }
}

/**
 * Send email via SendGrid API
 */
async function sendViaSendGrid({ to, from, subject, text, html, headers, apiKey, apiUrl }) {
  const url = apiUrl || 'https://api.sendgrid.com/v3/mail/send'
  
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

async function sendOtp({ to, code, subject = 'Your verification code', from = process.env.DEFAULT_FROM_EMAIL || process.env.EMAIL_HOST_USER }) {
  const ttlMin = Number(process.env.VERIFICATION_CODE_TTL_MIN || 10)
  const brandName = process.env.APP_BRAND_NAME || 'BizClear Business Center'
  const supportEmail = process.env.SUPPORT_EMAIL || process.env.EMAIL_HOST_USER || 'support@bizclear.com'
  const appUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:5173'
  const logoUrl = process.env.EMAIL_LOGO_URL || `${appUrl}/BizClear.png`

  const text = [
    'Hello,',
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
  <div style="background:#f0f2f5;padding:40px 0;margin:0;font-family:'Raleway', sans-serif;">
    <link href="https://fonts.googleapis.com/css2?family=Raleway:wght@400;600;700&display=swap" rel="stylesheet">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.08);overflow:hidden;">
      
      <!-- Header -->
      <div style="background:#003a70;padding:32px;text-align:center;">
        ${logoUrl ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:16px;">
          <tr>
            <td align="center">
              <img src="${logoUrl}" alt="${brandName}" width="200" height="auto" style="max-width:200px;width:200px;height:auto;display:block;margin:0 auto;border:0;outline:none;text-decoration:none;" />
            </td>
          </tr>
        </table>
        ` : ''}
        <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:1px;">${brandName}</h1>
      </div>

      <!-- Body -->
      <div style="padding:40px 32px;text-align:center;">
        <h2 style="margin:0 0 16px;font-size:22px;color:#1f1f1f;font-weight:700;">Verification Code</h2>
        
        <p style="margin:0 0 24px;color:#595959;font-size:16px;line-height:1.6;">
          You recently requested to sign in to your <strong>${brandName}</strong> account. Use the code below to complete your verification.
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
  `
  
  const isDevelopment = process.env.NODE_ENV !== 'production'
  
  try {
    // Validate email address first
    if (!to || !to.includes('@')) {
      throw new Error(`Invalid email address: ${to}`)
    }
    
    // Ensure 'from' is set
    const fromAddress = from || process.env.DEFAULT_FROM_EMAIL || 'noreply@example.com'
    
    console.log(`[Email API] Attempting to send OTP to ${to}... (Provider: ${process.env.EMAIL_API_PROVIDER || 'sendgrid'})`)
    
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
    
    console.log(`[Email API] ✅ OTP email sent successfully to ${to}`, { 
      messageId: result.messageId,
      accepted: result.accepted,
      rejected: result.rejected
    })
    
    // Check if email was actually rejected
    if (result.rejected && result.rejected.length > 0) {
      const error = new Error(`Email rejected for: ${result.rejected.join(', ')}`)
      console.log(`[Email API] ⚠️ Email was rejected`)
      console.log(`[Email API] Rejected recipients:`, result.rejected)
      throw error
    }
    
    return { success: true, messageId: result.messageId, accepted: result.accepted }
  } catch (err) {
    console.log('--------------------------------------------------')
    console.log('⚠️  EMAIL API FAILED ⚠️')
    console.log('To:', to)
    console.log('Code:', code)
    console.log('Subject:', subject)
    console.log('Error:', err.message)
    if (err.response) {
      console.log('API Response:', err.response.data)
      console.log('API Status:', err.response.status)
    }
    console.log('Stack:', err.stack)
    console.log('--------------------------------------------------')
    
    // Return failure result instead of silently swallowing
    return { success: false, error: err.message }
  }
}

async function sendStaffCredentialsEmail({ to, username, tempPassword, office, roleLabel, subject = 'Your Staff Account Credentials', from = process.env.DEFAULT_FROM_EMAIL || process.env.EMAIL_HOST_USER }) {
  const brandName = process.env.APP_BRAND_NAME || 'BizClear Business Center'
  const appUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:5173'
  const supportEmail = process.env.SUPPORT_EMAIL || process.env.EMAIL_HOST_USER || 'support@bizclear.com'

  const text = [
    `Welcome to ${brandName} Staff Portal`,
    '',
    'Your staff account has been created successfully.',
    '',
    'Here are your login credentials:',
    `Username: ${username}`,
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
  ].join('\n')

  const html = `
  <div style="background:#f0f2f5;padding:40px 0;margin:0;font-family:'Raleway', sans-serif;">
    <link href="https://fonts.googleapis.com/css2?family=Raleway:wght@400;600;700&display=swap" rel="stylesheet">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.08);overflow:hidden;">
      
      <!-- Header -->
      <div style="background:#003a70;padding:32px;text-align:center;">
        <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:1px;">${brandName} Staff Portal</h1>
      </div>

      <!-- Body -->
      <div style="padding:40px 32px;text-align:center;">
        <h2 style="margin:0 0 16px;font-size:22px;color:#1f1f1f;font-weight:700;">Welcome to the Team!</h2>
        
        <p style="margin:0 0 24px;color:#595959;font-size:16px;line-height:1.6;">
          Your staff account has been created. Use the credentials below to access the portal.
        </p>

        <div style="background:#f8f9fa;padding:24px;border-radius:8px;border:1px solid #e8e8e8;margin-bottom:24px;text-align:left;display:inline-block;min-width:300px;">
           <div style="margin-bottom:12px;">
             <span style="color:#8c8c8c;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Username</span><br>
             <span style="color:#003a70;font-size:18px;font-weight:700;">${username}</span>
           </div>
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
  <div style="background:#f0f2f5;padding:40px 0;margin:0;font-family:'Raleway', sans-serif;">
    <link href="https://fonts.googleapis.com/css2?family=Raleway:wght@400;600;700&display=swap" rel="stylesheet">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.08);overflow:hidden;">
      
      <!-- Header -->
      <div style="background:#003a70;padding:32px;text-align:center;">
        <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:1px;">${brandName}</h1>
      </div>

      <!-- Body -->
      <div style="padding:40px 32px;">
        <h2 style="margin:0 0 16px;font-size:22px;color:#1f1f1f;font-weight:700;">${isOldEmail ? 'Email Change Requested' : 'Email Change Confirmed'}</h2>
        
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
  <div style="background:#f0f2f5;padding:40px 0;margin:0;font-family:'Raleway', sans-serif;">
    <link href="https://fonts.googleapis.com/css2?family=Raleway:wght@400;600;700&display=swap" rel="stylesheet">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.08);overflow:hidden;">
      
      <!-- Header -->
      <div style="background:#003a70;padding:32px;text-align:center;">
        <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:1px;">${brandName}</h1>
      </div>

      <!-- Body -->
      <div style="padding:40px 32px;">
        <h2 style="margin:0 0 16px;font-size:22px;color:#1f1f1f;font-weight:700;">Password Changed Successfully</h2>
        
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
  <div style="background:#f0f2f5;padding:40px 0;margin:0;font-family:'Raleway', sans-serif;">
    <link href="https://fonts.googleapis.com/css2?family=Raleway:wght@400;600;700&display=swap" rel="stylesheet">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.08);overflow:hidden;">
      
      <!-- Header -->
      <div style="background:#ff4d4f;padding:32px;text-align:center;">
        <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:1px;">🚨 Security Alert</h1>
      </div>

      <!-- Body -->
      <div style="padding:40px 32px;">
        <h2 style="margin:0 0 16px;font-size:22px;color:#1f1f1f;font-weight:700;">Restricted Field Attempt</h2>
        
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
  <div style="background:#f0f2f5;padding:40px 0;margin:0;font-family:'Raleway', sans-serif;">
    <link href="https://fonts.googleapis.com/css2?family=Raleway:wght@400;600;700&display=swap" rel="stylesheet">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.08);overflow:hidden;">
      
      <!-- Header -->
      <div style="background:${status === 'approved' ? '#52c41a' : '#ff4d4f'};padding:32px;text-align:center;">
        <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:1px;">${status === 'approved' ? '✅' : '❌'} Request ${statusText}</h1>
      </div>

      <!-- Body -->
      <div style="padding:40px 32px;">
        <h2 style="margin:0 0 16px;font-size:22px;color:#1f1f1f;font-weight:700;">Approval Request ${statusText}</h2>
        
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
  sendStaffCredentialsEmail,
  sendEmailChangeNotification,
  sendPasswordChangeNotification,
  sendAdminAlertEmail,
  sendApprovalNotification,
}
