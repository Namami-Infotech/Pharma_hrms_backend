const { pool } = require('../../config/db');

const getLocation = async (req, res, next) => {
  try {
    const empId = req.query.emp_id ? String(req.query.emp_id).trim() : null;

    let rows;
    if (empId) {
      [rows] = await pool.query(
        'SELECT * FROM LiveTracking WHERE emp_id = ? ORDER BY server_time DESC',
        [empId]
      );
    } else {
      [rows] = await pool.query(
        'SELECT * FROM LiveTracking ORDER BY server_time DESC'
      );
    }

    if (rows.length > 0) {
      return res.json({ success: true, message: '', data: rows });
    } else {
      return res.json({ success: false, message: 'No tracking records found.', data: [] });
    }
  } catch (err) {
    return res.json({ success: false, message: 'An error occurred: ' + err.message });
  }
};

module.exports = getLocation;
