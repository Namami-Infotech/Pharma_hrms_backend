const { pool } = require('../../config/db');

const getAddress = async (req, res, next) => {
  try {
    const [records] = await pool.query(
      'SELECT id, latitude, longitude FROM LiveTracking WHERE Address IS NULL'
    );

    if (records.length === 0) {
      return res.json({
        success: false,
        message: 'No records found with NULL Address.',
        updated_records: 0
      });
    }

    let updatedCount = 0;

    for (const record of records) {
      const lat = record.latitude;
      const lon = record.longitude;

      try {
        const osmResponse = await axios.get(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
          {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; MyScript/1.0; +https://example.com)'
            },
            timeout: 5000
          }
        );

        if (osmResponse.data && osmResponse.data.display_name) {
          const address = osmResponse.data.display_name;
          const [result] = await pool.query(
            'UPDATE LiveTracking SET Address = ? WHERE id = ?',
            [address, record.id]
          );
          if (result.affectedRows > 0) {
            updatedCount++;
          }
        }
      } catch (osmErr) {
        // Skip failed geocoding entry without halting
      }
    }

    return res.json({
      success: true,
      message: `${updatedCount} records updated successfully.`,
      updated_records: updatedCount
    });
  } catch (err) {
    return res.json({ success: false, message: 'An error occurred: ' + err.message });
  }
};

// GET /src/track/get_location.php;

module.exports = getAddress;
