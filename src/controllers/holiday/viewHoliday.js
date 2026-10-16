const { pool } = require('../../config/db');

const viewHoliday = async (req, res, next) => {
  try {
    const tenantId = req.query.Tenent_Id || req.body?.Tenent_Id;

    if (!tenantId) {
      return res.json({ success: false, message: 'Missing Tenent_Id parameter.', data: [] });
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const financialYearStart = `${currentYear}-01-01`;
    const financialYearEnd = `${currentYear + 1}-12-31`;

    const [rows] = await pool.query(
      `SELECT * FROM Holidays 
       WHERE Tenent_Id = ? 
       AND date BETWEEN ? AND ? 
       ORDER BY date`,
      [tenantId, financialYearStart, financialYearEnd]
    );

    if (rows.length > 0) {
      return res.json({ success: true, message: '', data: rows });
    } else {
      return res.json({
        success: false,
        message: 'No holidays found for the given tenant and financial year.',
        data: []
      });
    }
  } catch (err) {
    return res.json({ success: false, message: 'Error: ' + err.message, data: [] });
  }
};

module.exports = viewHoliday;
