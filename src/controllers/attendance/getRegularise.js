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

    if (role === 'HR') {
      sql = 'SELECT * FROM Regularisation ORDER BY Date DESC';
    } else {
      sql = 'SELECT * FROM Regularisation WHERE EmpId = ? ORDER BY Date DESC';
      params.push(empId);
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
