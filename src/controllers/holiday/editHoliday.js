const { pool } = require('../../config/db');

const editHoliday = async (req, res, next) => {
  try {
    const data = req.body || {};
    const id = data.id || '';
    const title = data.title || '';
    const date = data.date || '';

    if (!id || !title || !date) {
      return res.json({ success: false, message: 'All fields are required.' });
    }

    const [result] = await pool.query(
      'UPDATE Holidays SET title = ?, date = ? WHERE id = ?',
      [title, date, id]
    );

    if (result.affectedRows > 0) {
      return res.json({ success: true, message: 'Holiday updated successfully.' });
    } else {
      return res.json({ success: false, message: 'Failed to update holiday.' });
    }
  } catch (err) {
    return res.json({ success: false, message: 'An error occurred: ' + err.message });
  }
};

// GET /src/holiday/view_holiday.php;

module.exports = editHoliday;
