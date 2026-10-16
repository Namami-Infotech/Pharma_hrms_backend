const { pool } = require('../../config/db');

const getSupport = async (req, res, next) => {
  try {
    const data = req.body || {};
    let tickets = data.tickets || [];

    if (tickets && typeof tickets === 'object' && !Array.isArray(tickets)) {
      tickets = [tickets];
    }

    if (!Array.isArray(tickets) || tickets.length === 0) {
      return res.json({
        success: false,
        message: 'Please provide a ticket or an array of tickets with all required fields.'
      });
    }

    let successCount = 0;
    let failureCount = 0;

    for (const ticket of tickets) {
      const empId = ticket.EmpId || '';
      const cat = ticket.Cat || '';
      const subCat = ticket.SubCat || '';
      const remark = ticket.Remark || '';
      const image = ticket.Image || '';
      const status = ticket.Status || '';
      const date = ticket.Date || '';

      if (empId && cat && subCat && remark && date) {
        try {
          await pool.query(
            `INSERT INTO Support_Tickets (EmpId, Cat, SubCat, Remark, Image, Status, Date)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [empId, cat, subCat, remark, image, status, date]
          );
          successCount++;
        } catch (err) {
          failureCount++;
        }
      } else {
        failureCount++;
      }
    }

    if (successCount > 0) {
      return res.json({
        success: true,
        message: `${successCount} ticket(s) added successfully.`
      });
    } else {
      return res.json({
        success: false,
        message: `Failed to add tickets. ${failureCount} record(s) had errors.`
      });
    }
  } catch (err) {
    next(err);
  }
};

// GET /src/support/get_ticket.php;

module.exports = getSupport;
