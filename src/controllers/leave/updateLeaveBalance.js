const db = require('../../config/db');

const updateLeaveBalance = async (req, res) => {
  const response = { success: false, message: '' };
  const data = req.body || {};
  const empid = data.empid || data.EmpId || '';

  if (!empid) {
    response.message = 'Please provide employee ID (empid).';
    return res.status(400).json(response);
  }

  try {
    const cl = parseFloat(data.CL ?? data.cl ?? 0);
    const tenantId = data.Tenent_Id || data.tenent_id || 1;

    const [existing] = await db.query(
      'SELECT id FROM EmployeeLeave WHERE EmpId = ? LIMIT 1',
      [empid]
    );

    if (existing && existing.length > 0) {
      await db.execute(
        'UPDATE EmployeeLeave SET CL = ? WHERE EmpId = ?',
        [cl, empid]
      );
    } else {
      await db.execute(
        'INSERT INTO EmployeeLeave (EmpId, CL, Tenent_Id) VALUES (?, ?, ?)',
        [empid, cl, tenantId]
      );
    }

    response.success = true;
    response.message = 'Employee leave balance updated successfully.';
    return res.json(response);
  } catch (err) {
    console.error('Error in updateLeaveBalance:', err);
    response.message = `An error occurred: ${err.message}`;
    return res.status(500).json(response);
  }
};

module.exports = updateLeaveBalance;
