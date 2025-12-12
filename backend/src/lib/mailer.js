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
  const brandName = process.env.APP_BRAND_NAME || 'Security Team'
  const text = [
    'Hello,',
    '',
    `Your verification code is: ${code}`,
    `This code expires in ${ttlMin} minutes.`,
    '',
    "If you didn’t request this, you can safely ignore this email.",
    '',
    'Thank you,',
    brandName
  ].join('\n')
  const html = `
  <div style="background:#f6f9fc;padding:24px;margin:0;">
    <div style="display:none;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden;color:transparent;">Your verification code expires in ${ttlMin} minutes.</div>
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;border:1px solid #eaeef3;padding:32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
      <div style="text-align:center;margin:0 0 12px;font-size:16px;color:#0f172a;font-weight:700;">${brandName}</div>
      <h1 style="margin:0 0 8px;font-size:20px;color:#0f172a;text-align:center;">Verify your email</h1>
      <p style="margin:0 8px 16px;color:#334155;text-align:center;">Use the code below to continue.</p>
      <div style="text-align:center;margin:0 0 12px;">
        <span style="display:inline-block;background:#e0f2fe;color:#0369a1;border:1px solid #bae6fd;border-radius:999px;padding:6px 12px;font-size:12px;font-weight:700;">Expires in ${ttlMin} minutes</span>
      </div>
      <div style="text-align:center;margin:0 0 8px;">
        <div style="display:inline-block;padding:16px 26px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc;font-size:28px;letter-spacing:8px;color:#0f172a;font-weight:800;font-family:SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono','Courier New',monospace;">${code}</div>
      </div>
      <p style="margin:12px 0 0;color:#64748b;text-align:center;">If you didn’t request this, you can safely ignore this email.</p>
    </div>
    <p style="text-align:center;margin:16px 0 0;color:#94a3b8;font-size:12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">This email was sent automatically. Please do not reply.</p>
  </div>
  `
  await transporter.sendMail({ from, to, subject, text, html })
}

module.exports = { sendOtp }
