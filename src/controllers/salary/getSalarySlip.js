const db = require('../../config/db');
const { calculateWeeklyOffs } = require('./salaryHelper');

const getSalarySlip = async (req, res) => {
  const response = { success: false, message: '', data: null };

  const month = (req.query.month || '').toString().trim();
  const year = req.query.year ? parseInt(req.query.year, 10) : null;
  const empId = (req.query.empId || '').toString().trim();

  if (month && year && empId) {
    try {
      const [rows] = await db.query(
        `SELECT * FROM salary_records_new 
         WHERE month = ? AND year = ? AND empId = ? 
         LIMIT 1`,
        [month, year, empId]
      );

      if (rows && rows.length > 0) {
        response.success = true;
        response.data = rows[0];
      } else {
        response.message = 'No records found for the given month, year, and employee ID.';
      }

      return res.json(response);
    } catch (err) {
      console.error('Error in getSalarySlip:', err);
      response.message = `Database error: ${err.message}`;
      return res.status(500).json(response);
    }
  } else {
    response.message = 'Required parameters: month, year, and empId.';
    return res.json(response);
  }
};

module.exports = getSalarySlip;
