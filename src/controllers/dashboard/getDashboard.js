const { pool } = require('../../config/db');

const getDashboard = async (req, res, next) => {
  try {
    const tenantId = req.query.tenant_id || req.body?.tenant_id;

    if (!tenantId) {
      return res.json({ success: false, message: 'Tenant ID is required.', data: [] });
    }

    const [rows] = await pool.query(
      'SELECT COUNT(*) as total_employees FROM Employees WHERE Tenent_Id = ? AND IsActive = 1',
      [tenantId]
    );

    const data = rows[0] || { total_employees: 0 };

    return res.json({
      success: true,
      message: '',
      data: data
    });
  } catch (err) {
    return res.json({ success: false, message: 'An error occurred: ' + err.message, data: [] });
  }
};

module.exports = getDashboard;
