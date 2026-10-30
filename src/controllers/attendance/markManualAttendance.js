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

  let userLat = null;
  let userLon = null;
  let actualDistance = 0;
  if (GeoLocation && GeoLocation.includes(',')) {
    const coords = GeoLocation.split(',').map((n) => parseFloat(n.trim()));
    userLat = isNaN(coords[0]) ? null : coords[0];
    userLon = isNaN(coords[1]) ? null : coords[1];
  }

  Event = Event.toLowerCase().trim().startsWith('in') ? 'In' : 'Out';

  let currentDate = '';
  let currentTime = '';
  if (MobileDateTime && MobileDateTime.includes(' ')) {
    const parts = MobileDateTime.trim().split(' ');
    currentDate = parts[0];
    currentTime = parts[1];
  } else if (MobileDateTime && MobileDateTime.includes('T')) {
    const d = new Date(MobileDateTime);
    currentDate = !isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
    currentTime = !isNaN(d.getTime()) ? d.toTimeString().slice(0, 8) : '00:00:00';
  } else {
    const now = new Date();
    currentDate = now.toISOString().slice(0, 10);
    currentTime = now.toTimeString().slice(0, 8);
  }

  const conn = await db.getConnection();
  try {
    const [lastRows] = await conn.query(
      `SELECT Event FROM Activity 
       WHERE EmpId = ? AND DATE(MobileDateTime) = ? 
       ORDER BY MobileDateTime DESC LIMIT 1`,
      [EmpId, currentDate]
    );

    const lastEvent = lastRows.length > 0 ? lastRows[0].Event : null;

    if (app_ver !== 'Manual') {
      if (Event === 'In' && lastEvent === 'In') {
        conn.release();
        return res.json({ success: false, message: 'Already checked in' });
      }

      if (Event === 'Out' && !lastEvent) {
        conn.release();
        return res.json({ success: false, message: 'Check-in required' });
      }
    }

    await conn.beginTransaction();

    await conn.execute(
      `INSERT INTO Activity 
       (EmpId, Activity, LocationId, Event, GeoLocation, Latitude, Longitude, Distance, Date, Time, MobileDateTime, ServerDateTime, Image, app_ver) 
       VALUES (?, 'Attendance', ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?)`,
      [
        EmpId,
        LocationId,
        Event,
        GeoLocation,
        userLat,
        userLon,
        actualDistance,
        currentDate,
        currentTime,
        MobileDateTime,
        imageUrl,
        app_ver
      ]
    );

    const [attRows] = await conn.query(
      'SELECT id, Date, InTime, OutTime FROM Attendance WHERE EmpId = ? AND (Date = ? OR DateTime = ?) ORDER BY id DESC LIMIT 1',
      [EmpId, currentDate, currentDate]
    );

    const attendance = attRows.length > 0 ? attRows[0] : null;

    if (!attendance && Event === 'In') {
      await conn.execute(
        `INSERT INTO Attendance (EmpId, Date, DateTime, InTime, InLatLong, InLatitude, InLongitude, InEvent, Status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, 'In', 'Present')`,
        [EmpId, currentDate, currentDate, MobileDateTime, GeoLocation, userLat, userLon]
      );
    } else if (attendance && Event === 'In') {
      await conn.execute(
        `UPDATE Attendance 
         SET InTime = ?, InLatLong = ?, InLatitude = ?, InLongitude = ?, InEvent = 'In', Status = 'Present' 
         WHERE id = ?`,
        [MobileDateTime, GeoLocation, userLat, userLon, attendance.id]
      );
    }

    if (Event === 'Out') {
      let targetAtt = attendance;
      if (!targetAtt) {
        const [prevRows] = await conn.query(
          'SELECT id, Date, InTime, OutTime FROM Attendance WHERE EmpId = ? AND (OutTime IS NULL OR OutTime = "") ORDER BY id DESC LIMIT 1',
          [EmpId]
        );
        if (prevRows.length > 0) {
          targetAtt = prevRows[0];
        }
      }

      if (targetAtt) {
        let totalHours = null;
        if (targetAtt.InTime) {
          totalHours = calculateWorkingHours(targetAtt.InTime, MobileDateTime);
        }

        await conn.execute(
          `UPDATE Attendance 
           SET OutTime = ?, OutLatLong = ?, OutLatitude = ?, OutLongitude = ?, OutEvent = 'Out', TotalHours = COALESCE(?, TotalHours) 
           WHERE id = ?`,
          [MobileDateTime, GeoLocation, userLat, userLon, totalHours, targetAtt.id]
        );
      } else {
        await conn.execute(
          `INSERT INTO Attendance (EmpId, Date, DateTime, OutTime, OutLatLong, OutLatitude, OutLongitude, OutEvent, Status) 
           VALUES (?, ?, ?, ?, ?, ?, ?, 'Out', 'Present')`,
          [EmpId, currentDate, currentDate, MobileDateTime, GeoLocation, userLat, userLon]
        );
      }
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
