const { pool } = require('../../config/db');
const { sendMail } = require('../../config/mailer');

const requestDemo = async (req, res, next) => {
  try {
    const inputData = req.body || {};
    const name = inputData.name;
    const email = inputData.email;
    const phoneNumber = inputData.number;
    const companyName = inputData.company;
    const companySize = inputData.company_size;

    if (!name || !email || !phoneNumber || !companyName || !companySize) {
      return res.json({
        success: false,
        message: 'Missing required fields: name, email, number, company, or company_size.',
        data: []
      });
    }

    const [result] = await pool.query(
      `INSERT INTO Demo (Name, Email, PhoneNumber, CompanyName, CompanySize) 
       VALUES (?, ?, ?, ?, ?)`,
      [name, email, phoneNumber, companyName, companySize]
    );

    if (result.affectedRows > 0) {
      // Send confirmation email to user
      try {
        await transporter.sendMail({
          from: mailFrom,
          to: `"${name}" <${email}>`,
          replyTo: mailFrom,
          subject: 'Thank you for requesting a demo!',
          html: `
            <p>Dear ${name},</p>
            <p>Thank you for requesting a demo with Namami Infotech. We will reach out to you shortly to schedule the demo.</p>
            <p>Best regards,<br>Namami Infotech Team</p>
          `
        });

        // Send notification email to team
        await transporter.sendMail({
          from: mailFrom,
          to: 'yash@namami-infotech.com',
          subject: 'New Demo Request Received',
          html: `
            <p>A new demo request has been received:</p>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone Number:</strong> ${phoneNumber}</p>
            <p><strong>Company Name:</strong> ${companyName}</p>
            <p><strong>Company Size:</strong> ${companySize}</p>
          `
        });
      } catch (mailErr) {
        return res.json({
          success: true,
          message: 'Demo entry successfully added. Error sending email: ' + mailErr.message,
          data: []
        });
      }

      return res.json({
        success: true,
        message: 'Demo entry successfully added.',
        data: []
      });
    } else {
      return res.json({
        success: false,
        message: 'Failed to add demo entry.',
        data: []
      });
    }
  } catch (err) {
    return res.json({ success: false, message: 'Error: ' + err.message, data: [] });
  }
};

// GET /src/test_db.php;

module.exports = requestDemo;
