const logger = require("./logger");

/**
 * Help Request Email Service
 * Sends transactional emails for the help request system.
 * Reuses the same sendEmail infrastructure as admin-service mailer.
 */

let sendEmailFn = null;

function getSendEmail() {
  if (sendEmailFn) return sendEmailFn;
  try {
    const {
      sendEmail,
    } = require("../../../../../../backend/services/admin-service/src/lib/mailer");
    sendEmailFn = sendEmail;
  } catch {
    // Fallback: inline minimal implementation matching admin-service pattern
    const axios = require("axios");
    sendEmailFn = async (opts) => {
      const provider = process.env.EMAIL_API_PROVIDER || "resend";
      const apiKey = process.env.EMAIL_API_KEY || "";
      const fromEmail = process.env.DEFAULT_FROM_EMAIL || "noreply@localhost";

      const devRedirectTo = process.env.EMAIL_DEV_REDIRECT_TO;
      let actualTo = opts.to;
      if (devRedirectTo && devRedirectTo.includes("@")) {
        actualTo = devRedirectTo.trim();
      }

      const placeholderKeys = [
        "your-sendgrid-api-key-here",
        "your-email-api-key-here",
        "your-resend-api-key-here",
      ];
      if (
        !apiKey ||
        placeholderKeys.some((p) => apiKey === p) ||
        process.env.NODE_ENV === "development"
      ) {
        logger.warn("HelpRequest Email: using mock sender", {
          to: actualTo,
          subject: opts.subject,
        });
        return {
          messageId: "mock-" + Date.now(),
          accepted: [actualTo],
          rejected: [],
        };
      }

      if (provider === "resend") {
        const url =
          process.env.EMAIL_API_URL || "https://api.resend.com/emails";
        const response = await axios.post(
          url,
          {
            from: fromEmail,
            to: [actualTo],
            subject: opts.subject,
            text: opts.text || "",
            html: opts.html || "",
          },
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
          },
        );
        return {
          messageId: response.data?.id || "unknown",
          accepted: [actualTo],
          rejected: [],
        };
      }
      // Fallback mock
      logger.warn("HelpRequest Email: unsupported provider, using mock", {
        provider,
      });
      return {
        messageId: "mock-" + Date.now(),
        accepted: [actualTo],
        rejected: [],
      };
    };
  }
  return sendEmailFn;
}

function buildEmailWrapper(title, bodyHtml) {
  const brandName = process.env.APP_BRAND_NAME || "BizClear Business Center";
  const appUrl =
    process.env.FRONTEND_URL || process.env.APP_URL || "http://localhost:5173";
  const supportEmail =
    process.env.SUPPORT_EMAIL ||
    process.env.EMAIL_HOST_USER ||
    "support@bizclear.com";

  return `<!DOCTYPE html>
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
    <div style="padding:40px 32px;">
      <h2 style="margin:0 0 16px;font-size:22px;color:#1f1f1f;font-weight:700;font-family:'Raleway', sans-serif;">${title}</h2>
      ${bodyHtml}
    </div>
    <div style="background:#fafafa;padding:24px;text-align:center;border-top:1px solid #f0f0f0;">
      <div style="color:#8c8c8c;font-size:12px;line-height:1.5;">
        <p style="margin:0 0 8px;"><strong>${brandName}</strong><br>Dagupan City, Philippines</p>
        <p style="margin:0;">Need help? <a href="mailto:${supportEmail}" style="color:#003a70;text-decoration:none;">Contact Support</a></p>
        <p style="margin:16px 0 0;font-size:11px;color:#bfbfbf;">&copy; ${new Date().getFullYear()} ${brandName}. All rights reserved.</p>
      </div>
    </div>
  </div>
</div>
</body>
</html>`;
}

async function sendHelpRequestConfirmation(to, requestId, subject) {
  const brandName = process.env.APP_BRAND_NAME || "BizClear Business Center";
  const appUrl =
    process.env.FRONTEND_URL || process.env.APP_URL || "http://localhost:5173";

  const bodyHtml = `
    <p style="margin:0 0 24px;color:#595959;font-size:16px;line-height:1.6;">
      Thank you for reaching out. We have received your help request and will respond as soon as possible.
    </p>
    <div style="background:#f8f9fa;padding:24px;border-radius:8px;border:1px solid #e8e8e8;margin-bottom:24px;">
      <div style="margin-bottom:12px;">
        <span style="color:#8c8c8c;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Reference Number</span><br>
        <span style="color:#003a70;font-size:18px;font-weight:700;font-family:monospace;">${requestId}</span>
      </div>
      <div>
        <span style="color:#8c8c8c;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Subject</span><br>
        <span style="color:#1f1f1f;font-size:16px;">${subject}</span>
      </div>
    </div>
    <p style="margin:0 0 16px;color:#595959;font-size:14px;">
      You will receive email notifications when our team responds to your request.
    </p>
    <a href="${appUrl}/help" style="display:inline-block;background:#003a70;color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:4px;font-weight:600;font-size:16px;">Visit Help Center</a>
  `;

  const html = buildEmailWrapper("Help Request Received", bodyHtml);
  const text = `Help Request Received\n\nReference: ${requestId}\nSubject: ${subject}\n\nWe will respond to your request as soon as possible.\n\n${brandName}`;

  try {
    const sendEmail = getSendEmail();
    await sendEmail({
      to,
      subject: `Help Request Received - ${requestId}`,
      text,
      html,
    });
    logger.info("Help request confirmation sent", { to, requestId });
  } catch (err) {
    logger.error("Failed to send help request confirmation", {
      to,
      requestId,
      error: err.message,
    });
  }
}

async function sendOfficerReplyNotification(to, requestId, messagePreview) {
  const brandName = process.env.APP_BRAND_NAME || "BizClear Business Center";

  const bodyHtml = `
    <p style="margin:0 0 24px;color:#595959;font-size:16px;line-height:1.6;">
      Our team has responded to your help request.
    </p>
    <div style="background:#f8f9fa;padding:24px;border-radius:8px;border:1px solid #e8e8e8;margin-bottom:24px;">
      <div style="margin-bottom:12px;">
        <span style="color:#8c8c8c;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Reference</span><br>
        <span style="color:#003a70;font-size:16px;font-weight:700;font-family:monospace;">${requestId}</span>
      </div>
      <div>
        <span style="color:#8c8c8c;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Message</span><br>
        <span style="color:#1f1f1f;font-size:14px;line-height:1.6;">${messagePreview}</span>
      </div>
    </div>
    <p style="margin:0;color:#595959;font-size:14px;">
      If you need to provide additional information, you may reply to this thread via the Help Center.
    </p>
  `;

  const html = buildEmailWrapper("New Reply to Your Help Request", bodyHtml);
  const text = `New Reply to Help Request ${requestId}\n\n${messagePreview}\n\n${brandName}`;

  try {
    const sendEmail = getSendEmail();
    await sendEmail({
      to,
      subject: `Reply to Help Request - ${requestId}`,
      text,
      html,
    });
    logger.info("Officer reply notification sent", { to, requestId });
  } catch (err) {
    logger.error("Failed to send officer reply notification", {
      to,
      requestId,
      error: err.message,
    });
  }
}

async function sendRequestClosedNotification(to, requestId, subject) {
  const brandName = process.env.APP_BRAND_NAME || "BizClear Business Center";

  const bodyHtml = `
    <p style="margin:0 0 24px;color:#595959;font-size:16px;line-height:1.6;">
      Your help request has been resolved and closed.
    </p>
    <div style="background:#f6ffed;padding:24px;border-radius:8px;border:1px solid #b7eb8f;margin-bottom:24px;">
      <div style="margin-bottom:12px;">
        <span style="color:#8c8c8c;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Reference</span><br>
        <span style="color:#003a70;font-size:16px;font-weight:700;font-family:monospace;">${requestId}</span>
      </div>
      <div>
        <span style="color:#8c8c8c;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Subject</span><br>
        <span style="color:#1f1f1f;font-size:14px;">${subject}</span>
      </div>
    </div>
    <p style="margin:0;color:#52c41a;font-size:16px;font-weight:600;">Status: Closed</p>
  `;

  const html = buildEmailWrapper("Help Request Closed", bodyHtml);
  const text = `Help Request Closed\n\nReference: ${requestId}\nSubject: ${subject}\nStatus: Closed\n\n${brandName}`;

  try {
    const sendEmail = getSendEmail();
    await sendEmail({
      to,
      subject: `Help Request Closed - ${requestId}`,
      text,
      html,
    });
    logger.info("Request closed notification sent", { to, requestId });
  } catch (err) {
    logger.error("Failed to send request closed notification", {
      to,
      requestId,
      error: err.message,
    });
  }
}

async function sendRequestInvalidNotification(to, requestId, subject) {
  const brandName = process.env.APP_BRAND_NAME || "BizClear Business Center";

  const bodyHtml = `
    <p style="margin:0 0 24px;color:#595959;font-size:16px;line-height:1.6;">
      Your help request has been reviewed and marked as invalid by our team.
    </p>
    <div style="background:#fff7e6;padding:24px;border-radius:8px;border:1px solid #ffd591;margin-bottom:24px;">
      <div style="margin-bottom:12px;">
        <span style="color:#8c8c8c;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Reference</span><br>
        <span style="color:#003a70;font-size:16px;font-weight:700;font-family:monospace;">${requestId}</span>
      </div>
      <div>
        <span style="color:#8c8c8c;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Subject</span><br>
        <span style="color:#1f1f1f;font-size:14px;">${subject}</span>
      </div>
    </div>
    <p style="margin:0;color:#faad14;font-size:16px;font-weight:600;">Status: Invalid</p>
    <p style="margin:16px 0 0;color:#595959;font-size:14px;">
      If you believe this is an error, please submit a new request with more details.
    </p>
  `;

  const html = buildEmailWrapper("Help Request Marked Invalid", bodyHtml);
  const text = `Help Request Invalid\n\nReference: ${requestId}\nSubject: ${subject}\nStatus: Invalid\n\nIf you believe this is an error, please submit a new request.\n\n${brandName}`;

  try {
    const sendEmail = getSendEmail();
    await sendEmail({
      to,
      subject: `Help Request Invalid - ${requestId}`,
      text,
      html,
    });
    logger.info("Request invalid notification sent", { to, requestId });
  } catch (err) {
    logger.error("Failed to send request invalid notification", {
      to,
      requestId,
      error: err.message,
    });
  }
}

module.exports = {
  sendHelpRequestConfirmation,
  sendOfficerReplyNotification,
  sendRequestClosedNotification,
  sendRequestInvalidNotification,
};
