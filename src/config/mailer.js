const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtpout.secureserver.net',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
  auth: {
    user: (process.env.SMTP_USER || 'communications@namami-infotech.com').trim(),
    pass: (process.env.SMTP_PASS || 'developer@2025').trim()
  },
  tls: {
    rejectUnauthorized: false
  }
});

async function sendMail({ to, cc, bcc, subject, html, text, from, replyTo, attachments }) {
  const fromEmail = (process.env.SMTP_FROM_EMAIL || 'info@aberdurepharma.com').trim();
  const fromName = process.env.SMTP_FROM_NAME || 'M/S ABERDURE PHARMA';
  const mailOptions = {
    from: from || `"${fromName}" <${fromEmail}>`,
    to,
    ...(cc && { cc }),
    ...(bcc && { bcc }),
    ...(replyTo && { replyTo }),
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
