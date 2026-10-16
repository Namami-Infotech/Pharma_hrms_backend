const { pool } = require('../../config/db');

const getTypes = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Type');
    if (rows.length > 0) {
      return res.json({
        success: true,
        message: 'Type retrieved successfully.',
        data: rows
      });
    } else {
      return res.json({ success: false, message: 'No Type found.', data: [] });
    }
  } catch (err) {
    return res.json({ success: false, message: 'Error retrieving Type: ' + err.message, data: [] });
  }
};

// GET /src/menu/get_type_ext.php;

module.exports = getTypes;
