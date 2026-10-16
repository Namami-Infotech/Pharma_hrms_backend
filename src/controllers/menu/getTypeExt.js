const { pool } = require('../../config/db');

const getTypeExt = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM TypeExt');
    if (rows.length > 0) {
      return res.json({
        success: true,
        message: 'TypeExt retrieved successfully.',
        data: rows
      });
    } else {
      return res.json({ success: false, message: 'No TypeExt found.', data: [] });
    }
  } catch (err) {
    return res.json({ success: false, message: 'Error retrieving TypeExt: ' + err.message, data: [] });
  }
};

module.exports = getTypeExt;
