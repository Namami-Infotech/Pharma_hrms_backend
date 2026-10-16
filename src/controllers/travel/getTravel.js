const db = require('../../config/db');

const getTravel = async (req, res) => {
  const response = { success: false, message: '', data: [] };
  const empId = req.query.empId || '';
  const role = req.query.role || '';

  try {
    let sql = '';
    const params = [];

    if (role === 'HR') {
      sql = 'SELECT * FROM TravelExpenses';
    } else {
      if (!empId) {
        response.message = 'empId parameter is required for non-HR roles.';
        return res.json(response);
      }
      sql = 'SELECT * FROM TravelExpenses WHERE empId = ?';
      params.push(empId);
    }

    const [rows] = await db.query(sql, params);

    response.success = true;
    response.data = rows;
    return res.json(response);
  } catch (err) {
    console.error('Error in getTravel:', err);
    response.message = `An error occurred: ${err.message}`;
    return res.status(500).json(response);
  }
};

// 3. Update Travel Status (src/travel/update_status.php);

module.exports = getTravel;
