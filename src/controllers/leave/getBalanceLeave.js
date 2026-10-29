const db = require('../../config/db');
const { getDayDiffInclusive } = require('./leaveHelper');

const getBalanceLeave = async (req, res) => {
  const response = { success: false, message: '', data: [] };
  const empid = req.query.empid || req.query.EmpId || req.query.empId || req.query.emp_id || req.body?.empid || req.body?.EmpId || req.body?.empId || req.body?.emp_id || '';

  if (!empid) {
    response.message = 'Please provide empid.';
    return res.json(response);
  }

  try {
    const [rows] = await db.query('SELECT * FROM EmployeeLeave WHERE EmpId = ? ORDER BY id DESC', [empid]);

    if (rows && rows.length > 0) {
      const data = rows[0];
      data.HalfDay = 1;

      response.success = true;
      response.data = data;
    } else {
      response.message = 'No leave data found for the given empid.';
    }

    return res.json(response);
  } catch (err) {
    console.error('Error in getBalanceLeave:', err);
    response.message = `An error occurred: ${err.message}`;
    return res.status(500).json(response);
  }
};

// 3. Get Leaves (src/leave/get_leave.php);

module.exports = getBalanceLeave;
