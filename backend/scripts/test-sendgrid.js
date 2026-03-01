#!/usr/bin/env node
/**
 * Send a test verification email using the configured provider (Resend, SendGrid, etc.).
 * Uses the same mailer as the auth service. Run from repo root.
 *
 * Usage:
 *   node backend/scripts/test-sendgrid.js
 *   node backend/scripts/test-sendgrid.js your@email.com
 *
 * Requires .env in repo root with EMAIL_API_KEY, EMAIL_API_PROVIDER (default: resend), DEFAULT_FROM_EMAIL.
 * If no email is given, uses test@mailinator.com (check inbox at https://www.mailinator.com).
 */

const path = require('path')

// Load repo root .env so EMAIL_* and DEFAULT_FROM_EMAIL are set
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') })

const to = process.argv[2] || 'test@mailinator.com'
const testCode = '123456'

async function main() {
  console.log('')
  console.log('Email test (configured provider)')
  console.log('--------------------------------')
  console.log('Provider:', process.env.EMAIL_API_PROVIDER || 'resend')
  console.log('From:   ', process.env.DEFAULT_FROM_EMAIL || '(not set)')
  console.log('To:     ', to)
  console.log('')

  const mailerPath = path.resolve(__dirname, '../services/auth-service/src/lib/mailer.js')
  const { sendOtp } = require(mailerPath)

  const result = await sendOtp({
    to,
    code: testCode,
    subject: 'Email test – BizClear',
  })

  if (result && result.success) {
    console.log('OK – Email sent successfully.')
    if (result.messageId) console.log('Message ID:', result.messageId)
    console.log('')
    console.log('Check the inbox for', to, '(subject: "Email test – BizClear", code:', testCode + ')')
    if (to.includes('mailinator.com')) {
      console.log('Mailinator: https://www.mailinator.com → enter the part before @')
    }
    console.log('')
    process.exit(0)
  }

  console.error('FAILED –', result?.error || 'Unknown error')
  console.error('')
  console.error('Common fixes:')
  console.error('  • Resend 403 "only send testing emails to your own email": with onboarding@resend.dev you can only send TO your Resend account email; use that address as the argument (e.g. node backend/scripts/test-sendgrid.js your@email.com). To send to anyone, verify a domain at resend.com/domains and use a from address on that domain.')
  console.error('  • Resend: use DEFAULT_FROM_EMAIL=onboarding@resend.dev (no domain needed); verify API key at https://resend.com/api-keys')
  console.error('  • SendGrid: verify DEFAULT_FROM_EMAIL in SendGrid → Sender Authentication')
  console.error('  • Check EMAIL_API_KEY is valid for your provider (re_ for Resend, SG. for SendGrid)')
  console.error('  • See README "Verification emails (signup / business owner registration)"')
  console.error('')
  process.exit(1)
}

main().catch((err) => {
  console.error('Error:', err.message)
  if (err.response?.data) console.error('API response:', err.response.data)
  process.exit(1)
})
