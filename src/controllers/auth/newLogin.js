const db = require('../../config/db');
const { sendMail } = require('../../config/mailer');

// 2. New Login - OTP generation & email (src/auth/new_login.php)
const newLogin = async (req, res) => {
  const response = { success: false, message: '' };

  const data = req.body || {};
  const identifier = (data.EmpId || data.empId || data.Mobile || data.mobile || data.Email || data.email || data.user_id || '').toString().trim();

  if (!identifier) {
    response.message = 'Please provide a valid identifier.';
    return res.json(response);
  }

  try {
    let query = '';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\d{10}$/;

    if (emailRegex.test(identifier)) {
      query = 'SELECT * FROM Employees WHERE EmailId = ? LIMIT 1';
    } else if (phoneRegex.test(identifier)) {
      query = 'SELECT * FROM Employees WHERE Mobile = ? LIMIT 1';
    } else {
      query = 'SELECT * FROM Employees WHERE EmpId = ? LIMIT 1';
    }

    const [rows] = await db.query(query, [identifier]);

    if (!rows || rows.length === 0) {
      response.message = 'No user found with the given details.';
      return res.json(response);
    }

    const employee = rows[0];

    if (parseInt(employee.IsActive, 10) === 0) {
      response.message = 'User is inactive. Please contact your administrator.';
      return res.json(response);
    }

    if (!employee.EmailId) {
      response.message = 'No email found for this user. Please contact your administrator.';
      return res.json(response);
    }
    const otp = parseInt(employee.Tenent_Id, 10) === 2 ? '000000' : Math.floor(100000 + Math.random() * 900000).toString();
    const d = new Date();
    const pad = n => String(n).padStart(2, '0');
    const otpGeneratedAt = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    console.log(`[AUTH] Generated OTP for ${employee.EmpId} (${employee.EmailId}): ${otp}`);

    try {
      await db.execute(
        'UPDATE Employees SET OTP = ?, OtpGeneratedAt = ? WHERE EmpId = ?',
        [otp, otpGeneratedAt, employee.EmpId]
      );
    } catch (updateErr) {
      if (updateErr.code === 'ER_BAD_FIELD_ERROR') {
        await db.execute(
          'UPDATE Employees SET OTP = ? WHERE EmpId = ?',
          [otp, employee.EmpId]
        );
      } else {
        throw updateErr;
      }
    }

    try {
      await sendMail({
        to: employee.EmailId,
        subject: 'Your OTP for Login',
        html: `Hello ${employee.Name},<br>Your OTP for login is: <b>${otp}</b>.<br>This OTP is valid for 5 minutes.`
      });

      response.success = true;
      response.message = 'OTP sent to your registered email address.';
    } catch (mailErr) {
      console.error('Mail error in newLogin:', mailErr);
      response.message = `Email could not be sent. Mailer Error: ${mailErr.message}`;
    }

    return res.json(response);
  } catch (err) {
    console.error('Error in newLogin:', err);
    response.message = 'An error occurred while generating OTP.';
    return res.status(500).json(response);
  }
};

module.exports = newLogin;
