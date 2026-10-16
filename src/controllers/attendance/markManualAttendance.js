const db = require('../../config/db');
const helpers = require('./attendanceHelper');
const { OFFICE_LAT, OFFICE_LON, calculateDistance, formatTimeAMPM, formatDateDDMMYYYY, calculateWorkingHours, saveBase64Image } = helpers;

const markManualAttendance = async (req, res) => {
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
  }

  const [userLat, userLon] = GeoLocation.split(',').map(Number);
  const actualDistance = parseFloat(
    calculateDistance(userLat, userLon, OFFICE_LAT, OFFICE_LON).toFixed(2)
  );

  Event = Event.toLowerCase().trim().startsWith('in') ? 'In' : 'Out';
  const currentDate = new Date(MobileDateTime).toISOString().slice(0, 10);

  const conn = await db.getConnection();
  try {
    const [lastRows] = await conn.query(
      `SELECT Event FROM Activity 
       WHERE EmpId = ? AND DATE(MobileDateTime) = ? 
       ORDER BY MobileDateTime DESC LIMIT 1`,
      [EmpId, currentDate]
    );

    const lastEvent = lastRows.length > 0 ? lastRows[0].Event : null;

    if (Event === 'In' && lastEvent === 'In') {
      conn.release();
      return res.json({ success: false, message: 'Already checked in' });
    }

    if (Event === 'Out' && !lastEvent) {
      conn.release();
      return res.json({ success: false, message: 'Check-in required' });
    }

    await conn.beginTransaction();

    await conn.execute(
      `INSERT INTO Activity 
       (EmpId, LocationId, Event, GeoLocation, Distance, MobileDateTime, ServerDateTime, Image, app_ver) 
       VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?)`,
      [
        EmpId,
        LocationId,
        Event,
        GeoLocation,
        actualDistance,
        MobileDateTime,
        imageUrl,
        app_ver
      ]
    );

    const [attRows] = await conn.query(
      'SELECT InTime, OutTime FROM Attendance WHERE EmpId = ? AND DateTime = ? LIMIT 1',
      [EmpId, currentDate]
    );

    const attendance = attRows.length > 0 ? attRows[0] : null;

    if (!attendance && Event === 'In') {
      await conn.execute(
        `INSERT INTO Attendance (EmpId, DateTime, InTime, InLatLong, InEvent) 
         VALUES (?, ?, ?, ?, 'In')`,
        [EmpId, currentDate, MobileDateTime, GeoLocation]
      );
    }

    if (attendance && !attendance.OutTime && Event === 'Out') {
      await conn.execute(
        `UPDATE Attendance 
         SET OutTime = ?, OutLatLong = ?, OutEvent = 'Out' 
         WHERE EmpId = ? AND DateTime = ?`,
        [MobileDateTime, GeoLocation, EmpId, currentDate]
      );
    }

    await conn.commit();
    return res.json({
      success: true,
      message: 'Attendance marked successfully',
      Event
    });
  } catch (err) {
    await conn.rollback();
    console.error('Error in markManualAttendance:', err);
    return res.json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
};

// 5. Get Raw Attendance (src/attendance/get_attendance.php);

module.exports = markManualAttendance;
