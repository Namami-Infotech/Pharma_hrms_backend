const db = require('../../config/db');
const { getDayDiffInclusive } = require('./leaveHelper');

const getLeaves = async (req, res) => {
  const response = { success: false, data: [], message: '' };
  const empId = req.query.empId || '';
  const role = req.query.role || '';

  try {
    let sql = '';
    const params = [];

    if (role) {
      if (role === 'HR') {
        sql = 'SELECT * FROM Leaves ORDER BY CreatedAt DESC';
      } else {
        response.message = 'Invalid role.';
        return res.json(response);
      }
    } else if (empId) {
      sql = 'SELECT * FROM Leaves WHERE EmpId = ? ORDER BY CreatedAt DESC';
      params.push(empId);
    } else {
      response.message = 'Either empId or role must be provided.';
      return res.json(response);
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
