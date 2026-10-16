const db = require('../../config/db');

const disableEmployee = async (req, res) => {
  const response = { success: false, message: '' };
  const data = req.body || {};

  const EmpId = data.EmpId || '';
  const action = (data.action || '').toLowerCase();
  const officeLeaveDate = data.office_leave_date || null;
  const reason = data.reason || null;

  if (!EmpId || !action) {
    response.message = 'Employee ID and action are required.';
    return res.json(response);
  }

  try {
    if (action === 'disable') {
      const sql = `
        UPDATE Employees 
        SET IsActive = 0,
            office_leave_date = ?,
            reason = ?
        WHERE EmpId = ?
      `;
      await db.execute(sql, [officeLeaveDate, reason, EmpId]);
      response.success = true;
      response.message = 'Employee disabled successfully.';
    } else if (action === 'enable') {
      const sql = `
        UPDATE Employees 
        SET IsActive = 1,
            office_leave_date = NULL,
            reason = NULL
        WHERE EmpId = ?
      `;
      await db.execute(sql, [EmpId]);
      response.success = true;
      response.message = 'Employee enabled successfully.';
    } else {
      response.message = 'Invalid action.';
    }

    return res.json(response);
  } catch (err) {
    console.error('Error in disableEmployee:', err);
    response.message = `Failed to update employee: ${err.message}`;
    return res.status(500).json(response);
  }
};

// 6. Add Office (src/employee/add_office.php);

module.exports = disableEmployee;
