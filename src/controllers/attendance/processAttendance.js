const db = require('../../config/db');
const { syncAttendance } = require('./syncAttendance');

const processAttendance = async (req, res) => {
  const response = { success: false, message: '', data: [] };
  const role = req.query.role || req.body?.role || req.user?.role || 'Admin';
  const isAdmin = ['Admin', 'admin', 'SuperAdmin'].includes(role);

  if (!isAdmin) {
    response.message = 'Unauthorized access. Only Admin can perform this action.';
    return res.json(response);
  }

  try {
    const empId = req.query.EmpId || req.body?.EmpId || null;
    const date = req.query.date || req.body?.date || null;
    const syncedCount = await syncAttendance(db, empId, date);

    const [rows] = await db.query('SELECT * FROM Attendance ORDER BY Date DESC, InTime DESC');
    response.success = true;
    response.message = `Successfully processed and synchronized ${syncedCount} attendance record(s).`;
    response.data = rows;
    return res.json(response);
  } catch (err) {
    console.error('Error in processAttendance:', err);
    response.message = `Error: ${err.message}`;
    return res.status(500).json(response);
  }
};

module.exports = processAttendance;
