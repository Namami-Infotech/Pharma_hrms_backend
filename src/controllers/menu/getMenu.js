const { pool } = require('../../config/db');

const getMenu = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Menu');
    if (rows.length > 0) {
      return res.json({
        success: true,
        message: 'Menu retrieved successfully.',
        data: rows
      });
    } else {
      return res.json({ success: false, message: 'No Menu found.', data: [] });
    }
  } catch (err) {
    return res.json({ success: false, message: 'Error retrieving Menu: ' + err.message, data: [] });
  }
};

// GET /src/menu/get_transaction.php;

module.exports = getMenu;
