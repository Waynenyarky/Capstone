const nodemailer = require('nodemailer')

function createTransport() {
  const host = process.env.EMAIL_HOST || process.env.SMTP_HOST
  const port = Number(process.env.EMAIL_PORT || process.env.SMTP_PORT || 587)
  const useSSL = String(process.env.EMAIL_USE_SSL || 'false').toLowerCase() === 'true'
  const useTLS = String(process.env.EMAIL_USE_TLS || 'false').toLowerCase() === 'true'
  const user = process.env.EMAIL_HOST_USER || process.env.SMTP_USER
  const pass = process.env.EMAIL_HOST_PASSWORD || process.env.SMTP_PASS
  if (!host || !user || !pass) {
    throw new Error('SMTP configuration missing: set EMAIL_HOST, EMAIL_HOST_USER, EMAIL_HOST_PASSWORD')
  }
  const secure = useSSL || port === 465
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    requireTLS: useTLS && !secure,
    auth: { user, pass },
  })
  return transporter
}

async function sendOtp({ to, code, subject = 'Your verification code', from = process.env.DEFAULT_FROM_EMAIL || process.env.EMAIL_HOST_USER }) {
  const transporter = createTransport()
  const ttlMin = Number(process.env.VERIFICATION_CODE_TTL_MIN || 10)
  const text = `Your verification code is ${code}. It expires in ${ttlMin} minutes.`
  const html = `<p>Your verification code is <strong>${code}</strong>.</p><p>It expires in ${ttlMin} minutes.</p>`
  await transporter.sendMail({ from, to, subject, text, html })
}

module.exports = { sendOtp }
