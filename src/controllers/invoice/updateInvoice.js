const { pool } = require('../../config/db');

const updateInvoice = async (req, res, next) => {
  try {
    const input = req.body || {};
    const invoiceId = input.id;
    const utrNo = input.utr_no;

    if (!invoiceId || !utrNo) {
      return res.json({ success: false, message: 'Missing required fields: id or utr_no.' });
    }

    const [result] = await pool.query(
      `UPDATE Invoices 
       SET utr_no = ?, 
           invoice_status = 'Paid',
           update_date_time = NOW()
       WHERE id = ?`,
      [utrNo, invoiceId]
    );

    if (result.affectedRows > 0) {
      return res.json({
        success: true,
        message: 'UTR number updated and invoice marked as Paid successfully.'
      });
    } else {
      return res.json({
        success: false,
        message: 'No invoice found with the given ID.'
      });
    }
  } catch (err) {
    return res.json({ success: false, message: 'Database error: ' + err.message });
  }
};

module.exports = updateInvoice;
