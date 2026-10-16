const { pool } = require('../../config/db');

const getCheckpoints = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Checkpoints');
    if (rows.length > 0) {
      return res.json({
        success: true,
        message: 'Checkpoints retrieved successfully.',
        data: rows
      });
    } else {
      return res.json({ success: false, message: 'No Checkpoints found.', data: [] });
    }
  } catch (err) {
    return res.json({ success: false, message: 'Error retrieving Checkpoints: ' + err.message, data: [] });
  }
};

// GET /src/menu/get_menu.php;

module.exports = getCheckpoints;
