const db = require('../../config/db');
const { calculateWeeklyOffs } = require('./salaryHelper');

const getSalary = async (req, res) => {
  const response = { success: false, message: '', data: [] };
  const empId = req.query.emp_id || null;

  try {
    let query = 'SELECT * FROM salary_structure_new';
    const params = [];
    const empId = req.query.emp_id || req.query.empId || req.query.EmpId || null;

    if (empId) {
      query += ' WHERE empId = ?';
      params.push(empId);
    }

    const [rows] = await db.query(query, params);

    response.success = true;
    response.data = rows || [];
    if (!rows || rows.length === 0) {
      response.message = 'No salary details found.';
    } else {
      response.message = 'Salary details fetched successfully.';
    }

    return res.json(response);
  } catch (err) {
    console.error('Error in getSalary:', err);
    response.message = `Error fetching salary details: ${err.message}`;
    return res.status(500).json(response);
  }
};

// 4. Salary Records (src/salary/salary_records.php);

module.exports = getSalary;
