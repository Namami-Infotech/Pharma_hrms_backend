const db = require('../../config/db');
const { calculateWeeklyOffs } = require('./salaryHelper');

const getSalaryRecords = async (req, res) => {
  const response = { success: false, message: '', data: null };

  if (req.query.month !== undefined && req.query.year !== undefined) {
    const month = parseInt(req.query.month, 10);
    const year = parseInt(req.query.year, 10);

    try {
      const [rows] = await db.query(
        'SELECT * FROM salary_records WHERE Month = ? AND Year = ?',
        [month, year]
      );

      if (rows && rows.length > 0) {
        response.success = true;
        response.data = rows;
      } else {
        response.message = 'No records found for the given month and year.';
      }

      return res.json(response);
    } catch (err) {
      console.error('Error in getSalaryRecords:', err);
      response.message = `Error: ${err.message}`;
      return res.status(500).json(response);
    }
  } else {
    response.message = 'Month and year are required.';
    return res.json(response);
  }
};

// 5. Salary Slip (src/salary/salary_slip.php);

module.exports = getSalaryRecords;
