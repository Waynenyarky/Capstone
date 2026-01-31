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
 */
async function sendEmail(opts) {
  const provider = process.env.EMAIL_API_PROVIDER || 'sendgrid'
  const apiKey = process.env.EMAIL_API_KEY || ''
  const apiUrl = process.env.EMAIL_API_URL || 'https://api.sendgrid.com/v3'
  const fromEmail = process.env.DEFAULT_FROM_EMAIL || 'noreply@localhost'

  // If no API key, use mock sender in development
  if (!apiKey || process.env.NODE_ENV === 'development') {
    const mockSender = createMockEmailSender()
    return await mockSender(opts)
  }

  try {
    if (provider === 'sendgrid') {
      const response = await axios.post(
        `${apiUrl}/mail/send`,
        {
          personalizations: [{
            to: [{ email: opts.to }],
            subject: opts.subject
          }],
          from: { email: fromEmail },
          content: [
            {
              type: opts.html ? 'text/html' : 'text/plain',
              value: opts.html || opts.text || ''
            }
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      )
      return {
        messageId: response.headers['x-message-id'] || 'unknown',
        accepted: [opts.to],
        rejected: [],
        response: '250 OK'
      }
    } else if (provider === 'mailgun') {
      const response = await axios.post(
        `${apiUrl}/messages`,
        new URLSearchParams({
          from: fromEmail,
          to: opts.to,
          subject: opts.subject,
          text: opts.text || '',
          html: opts.html || ''
        }),
        {
          auth: {
            username: 'api',
            password: apiKey
          }
        }
      )
      return {
        messageId: response.data.id || 'unknown',
        accepted: [opts.to],
        rejected: [],
        response: '250 OK'
      }
    } else {
      throw new Error(`Unsupported email provider: ${provider}`)
    }
  } catch (error) {
    console.error('Email send error:', error.message)
    // Fallback to mock in case of error
    const mockSender = createMockEmailSender()
    return await mockSender(opts)
  }
}

/**
 * Send admin alert email for restricted field attempts
 * @param {object} options - Email options
 * @param {string} options.to - Admin email
 * @param {string} options.adminName - Admin name
 * @param {string} options.userId - User ID who attempted
 * @param {string} options.userName - User name
 * @param {string} options.userEmail - User email
 * @param {string} options.field - Field attempted
 * @param {string} options.attemptedValue - Value attempted
 * @param {string} options.roleSlug - User role
 * @param {Date|string} options.timestamp - When attempt occurred
 * @param {string} options.subject - Email subject (optional)
 * @param {string} options.from - From email (optional)
 */
async function sendAdminAlertEmail({ to, adminName, userId, userName, userEmail, field, attemptedValue, roleSlug, timestamp, subject, from = process.env.DEFAULT_FROM_EMAIL || 'noreply@localhost' }) {
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
    await sendEmail({
      to,
      subject,
      text,
      html,
      from
    })
  } catch (err) {
    console.error('Failed to send admin alert email:', err.message)
    // Don't throw - admin alerts shouldn't break the application flow
  }
}

module.exports = { sendEmail, sendAdminAlertEmail }
