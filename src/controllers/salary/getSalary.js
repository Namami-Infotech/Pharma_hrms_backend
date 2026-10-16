const db = require('../../config/db');
const { calculateWeeklyOffs } = require('./salaryHelper');

const getSalary = async (req, res) => {
  const response = { success: false, message: '', data: [] };
  const empId = req.query.emp_id || null;

  try {
    let query = 'SELECT * FROM salary_structure_new';
    const params = [];

    if (empId) {
      query += ' WHERE EmpId = ?';
      params.push(empId);
    }

    const [rows] = await db.query(query, params);

    if (rows && rows.length > 0) {
      response.success = true;
      response.data = rows;
    } else {
      response.message = 'No salary details found.';
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
