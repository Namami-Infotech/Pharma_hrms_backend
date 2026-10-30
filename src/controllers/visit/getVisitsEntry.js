const db = require('../../config/db');
const { getDrivingDistance } = require('./visitHelper');

const getVisitsEntry = async (req, res) => {
  const response = { success: false, message: '', data: [] };
  const empId = req.query.EmpId || null;
  const role = req.query.role || null;

  try {
    let sql = '';
    const params = [];

    const isAdmin = ['Admin', 'admin', 'SuperAdmin'].includes(role);

    if (isAdmin) {
      sql = 'SELECT * FROM Visits';
    } else if (empId) {
      sql = `SELECT * FROM Visits 
             WHERE EmpId = ? OR EmpId IN (SELECT EmpId FROM Employees WHERE RM = ? OR RM = (SELECT Name FROM Employees WHERE EmpId = ? LIMIT 1))`;
      params.push(empId, empId, empId);
    } else {
      sql = 'SELECT * FROM Visits';
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
