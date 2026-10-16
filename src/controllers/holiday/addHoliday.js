const { pool } = require('../../config/db');

const addHoliday = async (req, res, next) => {
  try {
    const data = req.body || {};
    const tenentId = data.Tenent_Id;
    const holidays = data.holidays || [];

    if (!tenentId) {
      return res.json({ success: false, message: 'Tenent_Id is required.' });
    }

    if (!Array.isArray(holidays) || holidays.length === 0) {
      return res.json({ success: false, message: 'Please provide an array of holidays with date and title.' });
    }

    let successCount = 0;
    let failureCount = 0;

    for (const holiday of holidays) {
      const date = holiday.date || '';
      const title = holiday.title || '';

      if (date && title) {
        try {
          await pool.query(
            'INSERT INTO Holidays (date, title, Tenent_Id) VALUES (?, ?, ?)',
            [date, title, tenentId]
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
        message: `${successCount} holiday(s) added successfully.`
      });
    } else {
      return res.json({
        success: false,
        message: `Failed to add holidays. ${failureCount} record(s) had errors.`
      });
    }
  } catch (err) {
    next(err);
  }
};

// POST /src/holiday/edit_holiday.php;

module.exports = addHoliday;
