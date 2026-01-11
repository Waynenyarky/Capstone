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
  const brandName = process.env.APP_BRAND_NAME || 'BizClear Business Center'
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
  <div style="background:#f0f2f5;padding:40px 0;margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.08);overflow:hidden;">
      
      <!-- Header -->
      <div style="background:#001529;padding:32px;text-align:center;">
        <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:600;letter-spacing:1px;">${brandName}</h1>
      </div>

      <!-- Body -->
      <div style="padding:40px 32px;text-align:center;">
        <h2 style="margin:0 0 16px;font-size:22px;color:#1f1f1f;font-weight:600;">Verification Code</h2>
        
        <p style="margin:0 0 24px;color:#595959;font-size:16px;line-height:1.6;">
          Use the code below to complete your verification.
        </p>

        <div style="background:#fafafa;padding:24px;border-radius:8px;border:1px dashed #d9d9d9;margin-bottom:24px;display:inline-block;">
           <div style="font-size:32px;letter-spacing:8px;color:#1f1f1f;font-weight:700;font-family:monospace;">${code}</div>
        </div>

        <p style="margin:0;color:#8c8c8c;font-size:14px;">
           This code expires in ${ttlMin} minutes.
        </p>
      </div>

      <!-- Footer -->
      <div style="background:#fafafa;padding:24px;text-align:center;border-top:1px solid #f0f0f0;">
        <p style="margin:0;color:#bfbfbf;font-size:12px;">
          © ${new Date().getFullYear()} ${brandName}. All rights reserved.
        </p>
      </div>

    </div>
  </div>
  `
  try {
    await transporter.sendMail({ from, to, subject, text, html })
  } catch (err) {
    console.log('--------------------------------------------------')
    console.log('⚠️  SMTP FAILED (Mocking Send) ⚠️')
    console.log('To:', to)
    console.log('Code:', code)
    console.log('Error:', err.message)
    console.log('--------------------------------------------------')
  }
}

async function sendVerificationEmail({ to, link, subject = 'Verify your email' }) {
  const transporter = createTransport()
  const brandName = process.env.APP_BRAND_NAME || 'BizClear Business Center'
  
  const text = [
    'Hello,',
    '',
    'Please verify your email address by clicking the link below:',
    link,
    '',
    'If you didn’t request this, you can safely ignore this email.',
    '',
    'Thank you,',
    brandName
  ].join('\n')

  const html = `
  <div style="background:#f0f2f5;padding:40px 0;margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.08);overflow:hidden;">
      
      <!-- Header -->
      <div style="background:#001529;padding:32px;text-align:center;">
        <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:600;letter-spacing:1px;">${brandName}</h1>
      </div>

      <!-- Body -->
      <div style="padding:40px 32px;text-align:center;">
        <h2 style="margin:0 0 16px;font-size:22px;color:#1f1f1f;font-weight:600;">Verify your email</h2>
        
        <p style="margin:0 0 32px;color:#595959;font-size:16px;line-height:1.6;">
          Click the button below to verify your email address and activate your account.
        </p>

        <div style="margin-bottom:32px;">
          <a href="${link}" style="display:inline-block;background:#1677ff;color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:6px;font-weight:500;font-size:16px;transition:all 0.3s;box-shadow:0 2px 0 rgba(0,0,0,0.04);">
            Verify Email
          </a>
        </div>

        <p style="margin:0;color:#8c8c8c;font-size:14px;line-height:1.5;">
          If you didn't request this verification, you can simply ignore this email.
        </p>
      </div>

      <!-- Footer -->
      <div style="background:#fafafa;padding:24px;text-align:center;border-top:1px solid #f0f0f0;">
        <p style="margin:0;color:#bfbfbf;font-size:12px;">
          © ${new Date().getFullYear()} ${brandName}. All rights reserved.
        </p>
      </div>

    </div>
  </div>
  `
  try {
    await transporter.sendMail({ from: process.env.EMAIL_HOST_USER, to, subject, text, html })
  } catch (err) {
    console.log('--------------------------------------------------')
    console.log('⚠️  SMTP FAILED (Mocking Send) ⚠️')
    console.log('To:', to)
    console.log('Link:', link)
    console.log('Error:', err.message)
    console.log('--------------------------------------------------')
  }
}

module.exports = { sendOtp, sendVerificationEmail }
