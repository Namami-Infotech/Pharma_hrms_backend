const { pool } = require('../../config/db');

const getTicket = async (req, res, next) => {
  try {
    const empId = req.query.EmpId || req.body?.EmpId;
    const role = req.query.role || req.body?.role;

    const isAdmin = ['Admin', 'admin', 'SuperAdmin'].includes(role);

    if (role && isAdmin) {
      const [tickets] = await pool.query('SELECT * FROM Support_Tickets');
      if (tickets.length > 0) {
        return res.json({ success: true, message: '', data: tickets });
      } else {
        return res.json({ success: false, message: 'No tickets found.', data: [] });
      }
    } else if (empId) {
      const [tickets] = await pool.query('SELECT * FROM Support_Tickets WHERE EmpId = ?', [empId]);
      if (tickets.length > 0) {
        return res.json({ success: true, message: '', data: tickets });
      } else {
        return res.json({ success: false, message: 'No tickets found for this employee.', data: [] });
      }
    } else {
      return res.json({ success: false, message: 'Either role or EmpId is required.', data: [] });
    }
  } catch (err) {
    return res.json({ success: false, message: 'Database error: ' + err.message, data: [] });
  }
};

module.exports = getTicket;
