const db = require('../../config/db');
const helpers = require('./attendanceHelper');
const { OFFICE_LAT, OFFICE_LON, calculateDistance, formatTimeAMPM, formatDateDDMMYYYY, calculateWorkingHours, saveBase64Image } = helpers;

const correctActivity = async (req, res) => {
  const response = { success: false, updated: 0, message: '' };

  try {
    const [rows] = await db.query(
      'SELECT ActivityId, EmpId, GeoLocation, Distance, Event FROM Activity_New'
    );

    if (!rows || rows.length === 0) {
      response.message = 'No records found.';
      return res.json(response);
    }

    let updateCount = 0;
    for (const row of rows) {
      const id = row.ActivityId;
      const geo = row.GeoLocation;
      const event = row.Event;

      if (!geo || !geo.includes(',')) continue;

      const [lat, lng] = geo.split(',').map(Number);
      const actualDist = calculateDistance(lat, lng, OFFICE_LAT, OFFICE_LON);

      let newEvent = event;
      if (actualDist <= 200) {
        newEvent = event.toLowerCase().includes('out') ? 'Out' : 'In';
      }

      await db.execute(
        'UPDATE Activity_New SET Distance = ?, Event = ? WHERE ActivityId = ?',
        [actualDist, newEvent, id]
      );

      updateCount++;
    }

    response.success = true;
    response.updated = updateCount;
    response.message = 'All records corrected successfully.';
    return res.json(response);
  } catch (err) {
    console.error('Error in correctActivity:', err);
    response.message = err.message;
    return res.json(response);
  }
};

module.exports = correctActivity;
