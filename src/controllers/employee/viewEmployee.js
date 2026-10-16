const db = require('../../config/db');

const viewEmployee = async (req, res) => {
  const response = { success: false, message: '', data: null };
  const empId = req.query.EmpId || '';

  if (!empId) {
    response.message = 'Please provide an Employee ID.';
    return res.json(response);
  }

  try {
    const [rows] = await db.query('SELECT * FROM Employees WHERE EmpId = ? LIMIT 1', [empId]);

    if (rows && rows.length > 0) {
      response.success = true;
      response.data = rows[0];
    } else {
      response.message = 'No user found with this Employee ID.';
    }

    return res.json(response);
  } catch (err) {
    console.error('Error in viewEmployee:', err);
    response.message = `Database Error: ${err.message}`;
    return res.status(500).json(response);
  }
};

// 5. Disable / Enable Employee (src/employee/disable_employee.php);

module.exports = viewEmployee;
