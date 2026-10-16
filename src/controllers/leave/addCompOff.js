const db = require('../../config/db');
const { getDayDiffInclusive } = require('./leaveHelper');

const addCompOff = async (req, res) => {
  const response = { success: false, message: '' };
  const data = req.body || {};

  const empid = data.empid || '';
  const compOffDays = parseFloat(data.compOffDays);
  const compOffDate = data.compOffDate || '';

  if (!empid || isNaN(compOffDays) || !compOffDate) {
    response.message = 'Please provide a valid empid, compOffDays, and compOffDate.';
    return res.json(response);
  }

  try {
    const sql = `
      UPDATE EmployeeLeave 
      SET CompOff = CompOff + ?, 
          CompOffDates = CONCAT_WS(',', CompOffDates, ?) 
      WHERE empid = ?
    `;

    const [result] = await db.execute(sql, [compOffDays, compOffDate, empid]);

    if (result.affectedRows > 0) {
      response.success = true;
      response.message = 'CompOff leave count and dates updated successfully.';
    } else {
      response.message = 'Failed to update CompOff leave count and dates.';
    }

    return res.json(response);
  } catch (err) {
    console.error('Error in addCompOff:', err);
    response.message = `An error occurred: ${err.message}`;
    return res.status(500).json(response);
  }
};

// 6. Add PL (src/leave/add_pl.php);

module.exports = addCompOff;
