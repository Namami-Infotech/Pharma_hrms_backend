const nodemailer = require('nodemailer');
const path = require('path');

require('dotenv').config({
  path: path.join(__dirname, '../../.env')
});

const getCleanVal = (val, fallback = '') => {
  if (!val) return fallback;
  return String(val).replace(/^["']|["']$/g, '').trim();
};

const smtpHost = getCleanVal(process.env.SMTP_HOST, 'smtpout.secureserver.net');
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpUser = getCleanVal(process.env.SMTP_USER, 'communications@namami-infotech.com');
const smtpPass = getCleanVal(process.env.SMTP_PASS, '');

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: smtpUser,
    pass: smtpPass
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verify SMTP connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error(`[SMTP] Connection to ${smtpHost}:${smtpPort} as ${smtpUser} failed:`, error.message);
  } else {
    console.log(`[SMTP] Server ready to send emails via ${smtpHost}:${smtpPort} as ${smtpUser}`);
  }
});

async function sendMail({
  to,
  cc,
  bcc,
  subject,
  html,
  text,
  from,
  replyTo,
  attachments
}) {
  const fromName = getCleanVal(process.env.SMTP_FROM_NAME, 'Aberdure Pharma');
  const fromEmail = getCleanVal(process.env.SMTP_FROM_EMAIL, smtpUser);

  const mailOptions = {
    from: from || `"${fromName}" <${fromEmail}>`,
    to,
    ...(cc && { cc }),
    ...(bcc && { bcc }),
    ...(replyTo && { replyTo: getCleanVal(replyTo, fromEmail) }),
    ...(attachments && { attachments }),
    subject,
    html,
    text
  };

  return await transporter.sendMail(mailOptions);
}

module.exports = {
  transporter,
  sendMail
};
