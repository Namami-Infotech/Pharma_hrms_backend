const db = require('../../config/db');
const { sendMail } = require('../../config/mailer');
const { hashPassword } = require('./authHelper');

// 6. Forget Password (src/auth/forget_password.php)
const forgetPassword = async (req, res) => {
  const response = { success: false, message: '' };

  const data = req.body || {};
  const email = (data.email || '').toString().trim();

  if (!email) {
    response.message = 'Please provide an email address.';
    return res.json(response);
  }

  try {
    const [rows] = await db.query(
      'SELECT EmpId FROM Employees WHERE EmailId = ? AND IsActive = 1 LIMIT 1',
      [email]
    );

    if (!rows || rows.length === 0) {
      response.message = 'Email not found.';
      return res.json(response);
    }

    const empId = rows[0].EmpId;

    // Generate random 8 character password
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
    let newPassword = '';
    for (let i = 0; i < 8; i++) {
      newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const hashedPassword = hashPassword(newPassword);

    await db.execute(
      'UPDATE Employees SET Password = ? WHERE EmpId = ?',
      [hashedPassword, empId]
    );

    try {
      await sendMail({
        to: email,
        subject: 'Password Reset',
        html: `<p>Your new password is: <strong>${newPassword}</strong></p><p>Please change it after logging in.</p>`
      });

      response.success = true;
      response.message = 'A new password has been sent to your email address.';
    } catch (mailErr) {
      console.error('Error sending reset email:', mailErr);
      response.message = 'Failed to reset password. Please try again later.';
    }

    return res.json(response);
  } catch (err) {
    console.error('Error in forgetPassword:', err);
    response.message = `An error occurred: ${err.message}`;
    return res.status(500).json(response);
  }
};

module.exports = forgetPassword;
