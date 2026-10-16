const { pool } = require('../../config/db');

const addLocation = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const data = req.body || {};
    const locations = data.locations || [];

    if (!Array.isArray(locations) || locations.length === 0) {
      connection.release();
      return res.json({ success: false, message: 'No location data provided.' });
    }

    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substring(2)}`;

    await connection.beginTransaction();

    const insertSql = `
      INSERT INTO LiveTracking (batchId, emp_id, latitude, longitude, device_time, gps_status)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    for (const location of locations) {
      const empId = location.emp_id || '';
      const latitude = location.latitude || '';
      const longitude = location.longitude || '';
      const deviceTime = location.device_time || '';
      const gpsStatus = location.gps_status || '';

      if (latitude && longitude && deviceTime) {
        await connection.query(insertSql, [batchId, empId, latitude, longitude, deviceTime, gpsStatus]);
      } else {
        await connection.rollback();
        connection.release();
        return res.json({ success: false, message: 'Invalid location data provided.' });
      }
    }

    await connection.commit();
    connection.release();

    return res.json({
      success: true,
      message: `Locations saved successfully with batch ID: ${batchId}.`
    });
  } catch (err) {
    try {
      await connection.rollback();
    } catch (rbErr) {}
    connection.release();
    return res.json({ success: false, message: 'An error occurred: ' + err.message });
  }
};

// GET /src/track/address.php;

module.exports = addLocation;
