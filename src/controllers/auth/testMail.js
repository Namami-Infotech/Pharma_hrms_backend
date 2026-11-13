const { sendMail } = require('../../config/mailer');

const testMail = async (req, res) => {
  const targetEmail = (req.query.to || req.body.to || 'umangarya222@gmail.com').toString().trim();

  const smtpInfo = {
    host: process.env.SMTP_HOST || 'Not set',
    port: process.env.SMTP_PORT || '587',
    user: process.env.SMTP_USER || 'Not set',
    fromName: process.env.SMTP_FROM_NAME || 'Aberdure Pharma',
    fromEmail: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'Not set'
  };

  try {
    const info = await sendMail({
      to: targetEmail,
      subject: `Test Email from ${smtpInfo.fromName}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; max-width: 500px;">
          <h2 style="color: #f37021; margin-top: 0;">Email Configuration Working!</h2>
          <p>This is a test email sent from <strong>${smtpInfo.fromName}</strong>.</p>
          <p><strong>Sender Account:</strong> ${smtpInfo.fromEmail}</p>
          <p><strong>SMTP Host:</strong> ${smtpInfo.host}:${smtpInfo.port}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST)</p>
        </div>
      `,
      text: `Test email from ${smtpInfo.fromName}. Email configuration is working properly.`
    });

    return res.json({
      success: true,
      message: `Test email sent successfully to ${targetEmail}`,
      messageId: info.messageId,
      config: smtpInfo
    });
  } catch (err) {
    return res.status(200).json({
      success: false,
      message: `Mailer Error: ${err.message}`,
      config: smtpInfo
    });
  }
};

module.exports = testMail;

