const db = require('../../config/db');
const { getDayDiffInclusive } = require('./leaveHelper');

const getLeaves = async (req, res) => {
  const response = { success: false, data: [], message: '' };
  const empId = req.query.empId || req.body?.empId || '';
  const role = req.query.role || req.body?.role || '';

  try {
    let sql = '';
    const params = [];

    const isHrOrAdmin = ['HR', 'Admin', 'admin', 'SuperAdmin'].includes(role);
    const conditions = [];

    if (isHrOrAdmin) {
      if (empId) {
        conditions.push('EmpId = ?');
        params.push(empId);
      }
    } else if (empId) {
      conditions.push('EmpId = ?');
      params.push(empId);
    } else {
      response.message = 'Either empId or HR/Admin role must be provided.';
      return res.json(response);
    }

    if (conditions.length > 0) {
      sql = `SELECT * FROM Leaves WHERE ${conditions.join(' AND ')} ORDER BY CreatedAt DESC`;
    } else {
      sql = 'SELECT * FROM Leaves ORDER BY CreatedAt DESC';
    }

    const [rows] = await db.query(sql, params);

    if (rows && rows.length > 0) {
      response.success = true;
      response.data = rows;
    } else {
      response.message = 'No tickets found.';
    }

    return res.json(response);
  } catch (err) {
    console.error('Error in getLeaves:', err);
    response.message = `An error occurred: ${err.message}`;
    return res.status(500).json(response);
  }
};

// 4. Approve / Reject Leave (src/leave/approve_leave.php);

module.exports = getLeaves;
