const db = require('../../config/db');
const helpers = require('./attendanceHelper');
const { OFFICE_LAT, OFFICE_LON, calculateDistance, formatTimeAMPM, formatDateDDMMYYYY, calculateWorkingHours, saveBase64Image } = helpers;

const getRegularise = async (req, res) => {
  const response = { success: false, message: '', data: null };
  const role = req.query.role;
  const empId = req.query.EmpId;

  if (!role || !empId) {
    response.message = 'Missing role or EmpId parameter.';
    return res.json(response);
  }

  try {
    let sql = '';
    const params = [];

    const isAdmin = ['Admin', 'admin', 'SuperAdmin'].includes(role);

    if (isAdmin) {
      sql = 'SELECT *, COALESCE(RegID, id) AS RegID FROM Regularisation ORDER BY Date DESC';
    } else {
      // RM can access their own regularisation records AND records of employees under their RM
      sql = `SELECT *, COALESCE(RegID, id) AS RegID FROM Regularisation 
             WHERE EmpId = ? OR EmpId IN (SELECT EmpId FROM Employees WHERE RM = ? OR RM = (SELECT Name FROM Employees WHERE EmpId = ? LIMIT 1))
             ORDER BY Date DESC`;
      params.push(empId, empId, empId);
    }

    const [rows] = await db.query(sql, params);

    if (rows && rows.length > 0) {
      response.success = true;
      response.data = rows;
    } else {
      response.message = 'No regularisation records found.';
    }

    return res.json(response);
  } catch (err) {
    console.error('Error in getRegularise:', err);
    response.message = `Error: ${err.message}`;
    return res.status(500).json(response);
  }
};

// 11. Update Regularise (src/attendance/update_regularise.php);

module.exports = getRegularise;
