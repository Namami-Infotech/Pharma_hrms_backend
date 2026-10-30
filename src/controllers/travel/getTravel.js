const db = require('../../config/db');

const getTravel = async (req, res) => {
  const response = { success: false, message: '', data: [] };
  const empId = req.query.empId || '';
  const role = req.query.role || '';

  try {
    let sql = '';
    const params = [];

    const isAdmin = ['Admin', 'admin', 'SuperAdmin'].includes(role) ||
      (typeof role === 'string' && role.toLowerCase().includes('admin'));

    if (isAdmin) {
      sql = 'SELECT * FROM TravelExpenses';
    } else {
      if (!empId) {
        response.message = 'empId parameter is required for non-Admin roles.';
        return res.json(response);
      }
      // RM can access their own travel expenses AND travel expenses of employees under their RM
      sql = `SELECT * FROM TravelExpenses 
             WHERE empId = ? OR empId IN (SELECT EmpId FROM Employees WHERE RM = ? OR RM = (SELECT Name FROM Employees WHERE EmpId = ? LIMIT 1))`;
      params.push(empId, empId, empId);
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
