const db = require('../../config/db');
const helpers = require('./attendanceHelper');
const { OFFICE_LAT, OFFICE_LON, calculateDistance, formatTimeAMPM, formatDateDDMMYYYY, calculateWorkingHours, saveBase64Image } = helpers;

const markAttendance = async (req, res) => {
  const data = req.body || {};

  const EmpId = data.EmpId || '';
  const LocationId = data.LocationId || '';
  let Event = data.Event || '';
  const GeoLocation = data.GeoLocation || '';
  const MobileDateTime = data.MobileDateTime || '';
  const base64Image = data.image || '';
  const app_ver = data.app_ver || null;

  if (!EmpId || !LocationId || !Event || !GeoLocation || !MobileDateTime) {
    return res.json({ success: false, message: 'Required fields missing' });
  }

  let imageUrl = null;
  if (base64Image) {
    imageUrl = saveBase64Image(base64Image, 'attendance');
    if (!imageUrl) {
      return res.json({ success: false, message: 'Invalid image format' });
    }
  }

  if (!GeoLocation.includes(',')) {
    return res.json({ success: false, message: 'Invalid GeoLocation format' });
  }

  const [latStr, lonStr] = GeoLocation.split(',');
  const userLat = parseFloat(latStr);
  const userLon = parseFloat(lonStr);

  const actualDistance = parseFloat(
    calculateDistance(userLat, userLon, OFFICE_LAT, OFFICE_LON).toFixed(2)
  );

  const originalEvent = Event;
  const eventLower = Event.toLowerCase();
  let baseEvent = Event;
  

  if (eventLower.startsWith('in')) {
    baseEvent = 'In';
  } else if (eventLower.startsWith('out')) {
    baseEvent = 'Out';
  }

  Event = actualDistance <= 200 ? baseEvent : originalEvent;

  const currentDate = new Date(MobileDateTime).toISOString().slice(0, 10);

  try {
    const [lastRows] = await db.query(
      `SELECT Event FROM Activity 
       WHERE EmpId = ? AND DATE(MobileDateTime) = ? 
       ORDER BY MobileDateTime DESC LIMIT 1`,
      [EmpId, currentDate]
    );

    const lastEvent = lastRows.length > 0 ? lastRows[0].Event : null;

    if (Event === 'In' && lastEvent === 'In') {
      return res.json({
        success: false,
        message: 'Already checked in. Please check out first.'
      });
    }

    if (Event === 'Out' && !lastEvent) {
      return res.json({
        success: false,
        message: 'Cannot check out without checking in'
      });
    }

    const insertSql = `
      INSERT INTO Activity 
      (EmpId, LocationId, Event, GeoLocation, Distance, MobileDateTime, ServerDateTime, Image, app_ver) 
      VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?)
    `;

    await db.execute(insertSql, [
      EmpId,
      LocationId,
      Event,
      GeoLocation,
      actualDistance,
      MobileDateTime,
      imageUrl,
      app_ver
    ]);

    return res.json({
      success: true,
      message: 'Attendance marked successfully',
      InsertedEvent: Event,
      ActualDistance: actualDistance,
      ImageURL: imageUrl || '',
      app_ver: app_ver || ''
    });
  } catch (err) {
    console.error('Error in markAttendance:', err);
    return res.json({ success: false, message: `DB Error: ${err.message}` });
  }
};

// 2. Mark Attendance 1 (src/attendance/mark_attendance1.php);

module.exports = markAttendance;
