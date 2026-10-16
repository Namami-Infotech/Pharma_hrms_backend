const { pool } = require('../../config/db');

const addTransaction = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const input = req.body || {};
    const menuId = input.menuId !== undefined ? input.menuId : null;
    const activityId = input.ActivityId !== undefined ? input.ActivityId : null;
    const latLong = input.LatLong !== undefined ? input.LatLong : null;
    const dateTime = input.DateTime !== undefined ? input.DateTime : null;
    const chkData = input.data !== undefined ? input.data : {};

    if (!menuId || !activityId || !chkData || typeof chkData !== 'object' || Object.keys(chkData).length === 0) {
      connection.release();
      return res.json({ success: false, message: 'Invalid input data.', data: [] });
    }

    await connection.beginTransaction();

    await connection.query(
      'INSERT INTO TransactionHDR (MenuId, ActivityId) VALUES (?, ?)',
      [menuId, activityId]
    );

    const dtlSql = 'INSERT INTO TransactionDTL (ActivityId, ChkId, Value, LatLong, DateTime) VALUES (?, ?, ?, ?, ?)';

    for (const [chkId, value] of Object.entries(chkData)) {
      await connection.query(dtlSql, [activityId, chkId, value, latLong, dateTime]);
    }

    await connection.commit();
    connection.release();

    return res.json({
      success: true,
      message: 'Transaction recorded successfully.',
      data: { ActivityId: activityId }
    });
  } catch (err) {
    try {
      await connection.rollback();
    } catch (rbErr) {}
    connection.release();
    return res.json({ success: false, message: 'Error: ' + err.message, data: [] });
  }
};

// GET /src/menu/get_checkpoints.php;

module.exports = addTransaction;
