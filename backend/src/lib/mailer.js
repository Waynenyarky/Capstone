const nodemailer = require('nodemailer')

function createTransport() {
  const host = process.env.EMAIL_HOST || process.env.SMTP_HOST
  const port = Number(process.env.EMAIL_PORT || process.env.SMTP_PORT || 587)
  const useSSL = String(process.env.EMAIL_USE_SSL || 'false').toLowerCase() === 'true'
  const useTLS = String(process.env.EMAIL_USE_TLS || 'false').toLowerCase() === 'true'
  const user = process.env.EMAIL_HOST_USER || process.env.SMTP_USER
  const pass = process.env.EMAIL_HOST_PASSWORD || process.env.SMTP_PASS
  if (!host || !user || !pass) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('⚠️ SMTP configuration missing. Using mock transporter (logs to console).')
      return {
        sendMail: async (opts) => {
          console.log('📧 [MOCK EMAIL] To:', opts.to)
          console.log('Subject:', opts.subject)
          console.log('HTML:', opts.html)
          return { messageId: 'mock-id' }
        }
      }
    }
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
  const supportEmail = process.env.SUPPORT_EMAIL || process.env.EMAIL_HOST_USER || 'support@bizclear.com'
  const appUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:5173'

  const supportEmail = process.env.SUPPORT_EMAIL || process.env.EMAIL_HOST_USER || 'support@bizclear.com'
  const appUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:5173'

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
  <div style="background:#f0f2f5;padding:40px 0;margin:0;font-family:'Raleway', sans-serif;">
    <link href="https://fonts.googleapis.com/css2?family=Raleway:wght@400;600;700&display=swap" rel="stylesheet">
  <div style="background:#f0f2f5;padding:40px 0;margin:0;font-family:'Raleway', sans-serif;">
    <link href="https://fonts.googleapis.com/css2?family=Raleway:wght@400;600;700&display=swap" rel="stylesheet">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.08);overflow:hidden;">
      
      <!-- Header -->
      <div style="background:#003a70;padding:32px;text-align:center;">
        <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:1px;">${brandName}</h1>
      <div style="background:#003a70;padding:32px;text-align:center;">
        <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:1px;">${brandName}</h1>
      </div>

      <!-- Body -->
      <div style="padding:40px 32px;text-align:center;">
        <h2 style="margin:0 0 16px;font-size:22px;color:#1f1f1f;font-weight:700;">Verification Code</h2>
        <h2 style="margin:0 0 16px;font-size:22px;color:#1f1f1f;font-weight:700;">Verification Code</h2>
        
        <p style="margin:0 0 24px;color:#595959;font-size:16px;line-height:1.6;">
          You recently requested to sign in to your <strong>${brandName}</strong> account. Use the code below to complete your verification.
          You recently requested to sign in to your <strong>${brandName}</strong> account. Use the code below to complete your verification.
        </p>

        <div style="background:#f8f9fa;padding:24px;border-radius:8px;border:1px dashed #003a70;margin-bottom:24px;display:inline-block;">
           <div style="font-size:32px;letter-spacing:8px;color:#003a70;font-weight:700;font-family:monospace;">${code}</div>
        <div style="background:#f8f9fa;padding:24px;border-radius:8px;border:1px dashed #003a70;margin-bottom:24px;display:inline-block;">
           <div style="font-size:32px;letter-spacing:8px;color:#003a70;font-weight:700;font-family:monospace;">${code}</div>
        </div>

        <p style="margin:0 0 8px;color:#8c8c8c;font-size:14px;">
        <p style="margin:0 0 8px;color:#8c8c8c;font-size:14px;">
           This code expires in ${ttlMin} minutes.
        </p>
        
        <p style="margin:16px 0 0;color:#faad14;font-size:14px;font-weight:600;">
           ⚠️ Important: Do not share this code with anyone.
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
            Taguig City, Philippines
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
            Taguig City, Philippines
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



module.exports = { sendOtp }
