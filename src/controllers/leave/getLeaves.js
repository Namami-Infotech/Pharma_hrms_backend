const db = require('../../config/db');
const { getDayDiffInclusive } = require('./leaveHelper');

const getLeaves = async (req, res) => {
  const response = { success: false, data: [], message: '' };
  const empId = req.query.empId || req.body?.empId || '';
  const role = req.query.role || req.body?.role || '';

  try {
    let sql = '';
    const params = [];

    const isAdmin = ['Admin', 'admin', 'SuperAdmin'].includes(role);
    const conditions = [];

    if (isAdmin) {
      if (empId) {
        conditions.push('EmpId = ?');
        params.push(empId);
      }
    } else if (empId) {
      // RM can access their own leave requests AND leaves of employees under their RM
      conditions.push('(EmpId = ? OR EmpId IN (SELECT EmpId FROM Employees WHERE RM = ? OR RM = (SELECT Name FROM Employees WHERE EmpId = ? LIMIT 1)))');
      params.push(empId, empId, empId);
    } else {
      response.message = 'Either empId or Admin role must be provided.';
      return res.json(response);
    }

    if (conditions.length > 0) {
      sql = `SELECT * FROM Leaves WHERE ${conditions.join(' AND ')} ORDER BY CreatedAt DESC`;
    } else {
      sql = 'SELECT * FROM Leaves ORDER BY CreatedAt DESC';
    }

    const [rows] = await db.query(sql, params);

    if (rows && rows.length > 0) {
      const normalizedRows = rows.map(r => ({
        ...r,
        Id: r.id || r.Id,
        id: r.id || r.Id,
        Category: r.category || r.Category || r.LeaveType || 'Leave',
        category: r.category || r.Category || r.LeaveType || 'Leave',
      }));
      response.success = true;
      response.data = normalizedRows;
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
