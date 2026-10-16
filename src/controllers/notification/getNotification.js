const { pool } = require('../../config/db');

const getNotification = async (req, res, next) => {
  try {
    const tenentId = req.query.Tenent_Id || req.body?.Tenent_Id;

    if (!tenentId) {
      return res.json({ success: false, message: 'Tenent_Id is required.', notifications: [] });
    }

    const [rows] = await pool.query(
      'SELECT * FROM Notifications WHERE Tenent_Id = ? ORDER BY create_time DESC',
      [tenentId]
    );

    if (rows.length > 0) {
      return res.json({ success: true, message: '', notifications: rows });
    } else {
      return res.json({
        success: false,
        message: 'No notifications found for the given Tenent_Id.',
        notifications: []
      });
    }
  } catch (err) {
    return res.json({ success: false, message: 'Database error: ' + err.message, notifications: [] });
  }
};

module.exports = getNotification;
