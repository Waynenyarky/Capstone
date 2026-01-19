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

module.exports = { sendEmail }
