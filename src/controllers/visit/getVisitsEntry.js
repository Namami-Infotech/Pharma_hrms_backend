const db = require('../../config/db');
const { getDrivingDistance } = require('./visitHelper');

const getVisitsEntry = async (req, res) => {
  const response = { success: false, message: '', data: [] };
  const empId = req.query.EmpId || null;
  const role = req.query.role || null;

  try {
    let sql = '';
    const params = [];

    if (role === 'HR') {
      sql = 'SELECT * FROM Visits';
    } else if (empId) {
      sql = 'SELECT * FROM Visits WHERE EmpId = ?';
      params.push(empId);
    } else {
      response.message = 'EmpId or role is required.';
      return res.json(response);
    }

    const [visits] = await db.query(sql, params);

    if (!visits || visits.length === 0) {
      response.message = 'No visits found.';
    } else {
      response.success = true;
      response.data = visits;
      response.message = 'Visits retrieved successfully.';
    }

    return res.json(response);
  } catch (err) {
    console.error('Error in getVisitsEntry:', err);
    response.message = `Error: ${err.message}`;
    return res.status(500).json(response);
  }
};

// 3. Planned Visits (src/visit/plan.php);

module.exports = getVisitsEntry;
