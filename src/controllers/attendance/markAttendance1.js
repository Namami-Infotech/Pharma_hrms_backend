const db = require('../../config/db');
const helpers = require('./attendanceHelper');
const { OFFICE_LAT, OFFICE_LON, calculateDistance, formatTimeAMPM, formatDateDDMMYYYY, calculateWorkingHours, saveBase64Image } = helpers;

const markAttendance1 = async (req, res) => {
  const data = req.body || {};

  const EmpId = data.EmpId || '';
  const LocationId = data.LocationId || '';
  const Event = data.Event || '';
  const GeoLocation = data.GeoLocation || '';
  const Distance = data.Distance || 0;
  const MobileDateTime = data.MobileDateTime || '';
  const base64Image = data.image || '';

  let imageUrl = null;
  if (base64Image) {
    imageUrl = saveBase64Image(base64Image, 'attendance');
    if (!imageUrl) {
      return res.json({ success: false, message: 'Invalid base64 image data.' });
    }
  }

  if (!EmpId || !LocationId || !Event || !GeoLocation || !MobileDateTime) {
    return res.json({ success: false, message: 'Please fill in all required fields.' });
  }

  try {
    const currentDate = new Date(MobileDateTime).toISOString().slice(0, 10);

    const [shiftRows] = await db.query(
      'SELECT Shift FROM Employees WHERE EmpId = ? LIMIT 1',
      [EmpId]
    );

    const shiftTiming = shiftRows.length > 0 ? shiftRows[0].Shift : null;
    if (!shiftTiming || !shiftTiming.includes('-')) {
      return res.json({
        success: false,
        message: 'Shift timing not found or invalid format.'
      });
    }

    const [inRows] = await db.query(
      'SELECT COUNT(*) as inCount FROM Activity WHERE EmpId = ? AND Event = "in" AND DATE(MobileDateTime) = ?',
      [EmpId, currentDate]
    );
    const inEventCount = inRows[0].inCount;

    const [lastRows] = await db.query(
      'SELECT Event, MobileDateTime FROM Activity WHERE EmpId = ? ORDER BY ServerDateTime DESC LIMIT 1',
      [EmpId]
    );
    const lastEvent = lastRows.length > 0 ? lastRows[0] : null;

    if (Event === 'in' && inEventCount > 0 && lastEvent && lastEvent.Event === 'in') {
      return res.json({
        success: false,
        message: 'Already checked in today. Please check out first.'
      });
    }

    const insertSql = `
      INSERT INTO Activity 
      (EmpId, LocationId, Event, GeoLocation, Distance, MobileDateTime, ServerDateTime, Image) 
      VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)
    `;

    await db.execute(insertSql, [
      EmpId,
      LocationId,
      Event,
      GeoLocation,
      Distance,
      MobileDateTime,
      imageUrl
    ]);

    return res.json({
      success: true,
      message: 'Successfully marked attendance.',
      ImageURL: imageUrl
    });
  } catch (err) {
    console.error('Error in markAttendance1:', err);
    return res.json({ success: false, message: `Error: ${err.message}` });
  }
};

// 3. Mobile Attendance & Old Mark Attendance (src/attendance/mobile_attendance.php & old_mark_attendance.php);

module.exports = markAttendance1;
