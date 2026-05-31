const nodemailer = require('nodemailer');

let cachedTransporter = null;

function readEnv(name) {
  const value = process.env[name];

  if (!value) {
    return '';
  }

  return value.trim().replace(/^['"]|['"]$/g, '');
}

function getEmailConfig() {
  const user = readEnv('SMTP_USER') || readEnv('GMAIL_USER') || readEnv('GMAIL_EMAIL');
  const pass = readEnv('SMTP_PASS') || readEnv('GMAIL_APP_PASSWORD') || readEnv('GMAIL_PASSWORD');

  if (!user || !pass) {
    return null;
  }

  const host = readEnv('SMTP_HOST') || 'smtp.gmail.com';
  const rawPort = readEnv('SMTP_PORT');
  const rawSecure = readEnv('SMTP_SECURE');

  // Defaults chosen to be more compatible with serverless platforms:
  // - Gmail commonly works on 587 (STARTTLS) whereas 465 can be blocked by some hosts.
  const isGmailHost = host.toLowerCase() === 'smtp.gmail.com';
  const port = rawPort ? Number(rawPort) : isGmailHost ? 587 : 465;
  const secure = rawSecure ? rawSecure === 'true' : port === 465;

  return {
    host,
    port,
    secure,
    user,
    pass,
    from: readEnv('MAIL_FROM') || readEnv('SMTP_FROM') || user
  };
}

function getTransporter() {
  const config = getEmailConfig();

  if (!config) {
    return null;
  }

  if (!cachedTransporter) {
    const isServerless = Boolean(process.env.VERCEL || process.env.AWS_REGION || process.env.LAMBDA_TASK_ROOT);

    cachedTransporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      // Pooling assumes a long-lived process. On serverless each invocation may
      // be a fresh, short-lived container, so a single non-pooled connection is
      // more reliable and avoids a stalled pool on cold starts.
      pool: !isServerless,
      // Keep handshakes well under the platform's function timeout (Vercel Hobby
      // kills functions at ~10s, so a 20s socket timeout never gets to fire).
      connectionTimeout: isServerless ? 8_000 : 15_000,
      greetingTimeout: isServerless ? 7_000 : 15_000,
      socketTimeout: isServerless ? 8_000 : 20_000,
      auth: {
        user: config.user,
        pass: config.pass
      }
    });
  }

  return {
    transporter: cachedTransporter,
    from: config.from
  };
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function sendDualApprovalRequestEmail({ to, approverName, ownerName, entryTitle, approvalUrl }) {
  const mailer = getTransporter();

  if (!mailer) {
    console.warn('Approval email skipped: SMTP_USER/GMAIL_USER and SMTP_PASS/GMAIL_APP_PASSWORD are not configured.');
    return { sent: false, skipped: true };
  }

  const safeApproverName = approverName || 'there';
  const safeOwnerName = ownerName || 'A VaultX user';
  const subject = `VaultX access approval requested by ${safeOwnerName}`;
  const htmlApproverName = escapeHtml(safeApproverName);
  const htmlOwnerName = escapeHtml(safeOwnerName);
  const htmlEntryTitle = escapeHtml(entryTitle);
  const htmlApprovalUrl = escapeHtml(approvalUrl);
  const text = [
    `Hi ${safeApproverName},`,
    '',
    `${safeOwnerName} requested your approval to access "${entryTitle}".`,
    `Open this link to review and grant access: ${approvalUrl}`,
    '',
    'This approval unlocks the entry for 10 minutes after you approve it.',
    '',
    'VaultX'
  ].join('\n');

  const html = `
    <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.6">
      <p>Hi ${htmlApproverName},</p>
      <p><strong>${htmlOwnerName}</strong> requested your approval to access <strong>${htmlEntryTitle}</strong>.</p>
      <p>
        <a href="${htmlApprovalUrl}" style="display:inline-block;border-radius:8px;background:#2563eb;color:#ffffff;padding:10px 16px;text-decoration:none">
          Review and grant access
        </a>
      </p>
      <p>This approval unlocks the entry for 10 minutes after you approve it.</p>
      <p>VaultX</p>
    </div>
  `;

  await mailer.transporter.sendMail({
    from: mailer.from,
    to,
    subject,
    text,
    html
  });

  return { sent: true, skipped: false };
}

async function sendPasswordResetCodeEmail({ to, name, code }) {
  const mailer = getTransporter();

  if (!mailer) {
    console.warn('Password reset email skipped: SMTP_USER/GMAIL_USER and SMTP_PASS/GMAIL_APP_PASSWORD are not configured.');
    return { sent: false, skipped: true };
  }

  const safeName = name || 'there';
  const htmlName = escapeHtml(safeName);
  const htmlCode = escapeHtml(code);
  const subject = 'VaultX password recovery code';
  const text = [
    `Hi ${safeName},`,
    '',
    `Your VaultX password recovery code is: ${code}`,
    '',
    'This code expires in 10 minutes. If you did not request this, you can ignore this email.',
    '',
    'VaultX'
  ].join('\n');

  const html = `
    <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.6">
      <p>Hi ${htmlName},</p>
      <p>Your VaultX password recovery code is:</p>
      <p style="font-size:28px;letter-spacing:8px;font-weight:700;margin:16px 0">${htmlCode}</p>
      <p>This code expires in 10 minutes. If you did not request this, you can ignore this email.</p>
      <p>VaultX</p>
    </div>
  `;

  const mailOptions = { from: mailer.from, to, subject, text, html };

  // Retry once for transient network/SMTP failures (common on serverless).
  try {
    await mailer.transporter.sendMail(mailOptions);
  } catch (error) {
    const code = error?.code;
    const message = String(error?.message || '');
    const isTransient =
      code === 'ETIMEDOUT' ||
      code === 'ECONNRESET' ||
      code === 'EAI_AGAIN' ||
      code === 'ESOCKET' ||
      /timed out|socket|connection.*closed/i.test(message);

    if (!isTransient) {
      throw error;
    }

    await new Promise((resolve) => setTimeout(resolve, 800));
    await mailer.transporter.sendMail(mailOptions);
  }

  return { sent: true, skipped: false };
}

module.exports = {
  sendDualApprovalRequestEmail,
  sendPasswordResetCodeEmail
};
