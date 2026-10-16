const { pool } = require('../../config/db');

const viewPolicy = async (req, res, next) => {
  try {
    const tenentId = req.query.Tenent_Id || req.body?.Tenent_Id;

    if (!tenentId) {
      return res.json({ success: false, message: 'Tenent_Id is required.', data: [] });
    }

    const [rows] = await pool.query(
      'SELECT * FROM OrganizationPolicy WHERE Tenent_Id = ?',
      [tenentId]
    );

    return res.json({ success: true, message: '', data: rows });
  } catch (err) {
    return res.json({ success: false, message: 'Error: ' + err.message, data: [] });
  }
};

module.exports = viewPolicy;
