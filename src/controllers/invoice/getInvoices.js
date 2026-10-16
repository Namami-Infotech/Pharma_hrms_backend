const { pool } = require('../../config/db');

const getInvoices = async (req, res, next) => {
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-indexed
    const currentYear = now.getFullYear();

    let financialYearStart;
    let financialYearEnd;

    if (currentMonth >= 4) {
      financialYearStart = `${currentYear}-04-01`;
      financialYearEnd = `${currentYear + 1}-03-31`;
    } else {
      financialYearStart = `${currentYear - 1}-04-01`;
      financialYearEnd = `${currentYear}-03-31`;
    }

    const [rows] = await pool.query(
      `SELECT * FROM Invoices 
       WHERE invoice_date BETWEEN ? AND ? 
       ORDER BY invoice_date DESC`,
      [financialYearStart, financialYearEnd]
    );

    if (rows.length > 0) {
      return res.json({ success: true, message: '', data: rows });
    } else {
      return res.json({
        success: false,
        message: 'No invoices found for the current financial year.',
        data: []
      });
    }
  } catch (err) {
    return res.json({ success: false, message: 'Database error: ' + err.message, data: [] });
  }
};

// POST /src/invoices/update_invoice.php;

module.exports = getInvoices;
