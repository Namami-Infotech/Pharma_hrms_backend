const db = require('../../config/db');
const { verifyPassword, hashPassword } = require('./authHelper');

// 5. Change Password (src/auth/change_password.php)
const changePassword = async (req, res) => {
  const response = { success: false, message: '' };

  const data = req.body || {};
  const EmpId = (data.EmpId || '').toString().trim();
  const currentPassword = (data.currentPassword || '').toString();
  const newPassword = (data.newPassword || '').toString();

  if (!EmpId || !currentPassword || !newPassword) {
    response.message = 'Please fill in all fields.';
    return res.json(response);
  }

  try {
    const [rows] = await db.query(
      'SELECT Password FROM Employees WHERE EmpId = ? LIMIT 1',
      [EmpId]
    );

    if (!rows || rows.length === 0) {
      response.message = 'No user found with this Employee ID.';
      return res.json(response);
    }

    const storedHash = rows[0].Password;
    if (!verifyPassword(currentPassword, storedHash)) {
      response.message = 'Current password is incorrect.';
      return res.json(response);
    }

    const newHashed = hashPassword(newPassword);
    const updateResult = await db.execute(
      'UPDATE Employees SET Password = ? WHERE EmpId = ?',
      [newHashed, EmpId]
    );
    console.log(`[AUTH] changePassword result: affectedRows=`, updateResult);

    if (updateResult) {
      response.success = true;
      response.message = 'Password updated successfully.';
    } else {
      response.message = 'Failed to update password.';
      response.success = false;
    }

    return res.json(response);
  } catch (err) {
    console.error('Error in changePassword:', err);
    response.message = `Database error: ${err.message}`;
    return res.status(500).json(response);
  }
};

module.exports = changePassword;
