#!/usr/bin/env node
/**
 * Send a test verification email to check if SendGrid (or configured provider) is working.
 * Uses the same mailer as the auth service. Run from repo root.
 *
 * Usage:
 *   node backend/scripts/test-sendgrid.js
 *   node backend/scripts/test-sendgrid.js your@email.com
 *
 * Requires .env in repo root with EMAIL_API_KEY, DEFAULT_FROM_EMAIL, etc.
 * If no email is given, uses test@mailinator.com (check inbox at https://www.mailinator.com).
 */

const path = require('path')

// Load repo root .env so EMAIL_* and DEFAULT_FROM_EMAIL are set
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') })

const to = process.argv[2] || 'test@mailinator.com'
const testCode = '123456'

async function main() {
  console.log('')
  console.log('SendGrid / Email test')
  console.log('---------------------')
  console.log('Provider:', process.env.EMAIL_API_PROVIDER || 'sendgrid')
  console.log('From:   ', process.env.DEFAULT_FROM_EMAIL || '(not set)')
  console.log('To:     ', to)
  console.log('')

  const mailerPath = path.resolve(__dirname, '../services/auth-service/src/lib/mailer.js')
  const { sendOtp } = require(mailerPath)

  const result = await sendOtp({
    to,
    code: testCode,
    subject: 'SendGrid test – BizClear',
  })

  if (result && result.success) {
    console.log('OK – Email sent successfully.')
    if (result.messageId) console.log('Message ID:', result.messageId)
    console.log('')
    console.log('Check the inbox for', to, '(subject: "SendGrid test – BizClear", code:', testCode + ')')
    if (to.includes('mailinator.com')) {
      console.log('Mailinator: https://www.mailinator.com → enter the part before @')
    }
    console.log('')
    process.exit(0)
  }

  console.error('FAILED –', result?.error || 'Unknown error')
  console.error('')
  console.error('Common fixes:')
  console.error('  • SendGrid: verify DEFAULT_FROM_EMAIL in SendGrid → Settings → Sender Authentication')
  console.error('  • Check EMAIL_API_KEY is valid (starts with SG. for SendGrid)')
  console.error('  • See README "Verification emails (signup / business owner registration)"')
  console.error('')
  process.exit(1)
}

main().catch((err) => {
  console.error('Error:', err.message)
  if (err.response?.data) console.error('API response:', err.response.data)
  process.exit(1)
})
