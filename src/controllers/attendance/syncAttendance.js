const helpers = require('./attendanceHelper');
const { calculateWorkingHours } = helpers;

/**
 * Synchronize attendance records from Activity table into Attendance table.
 * Groups punches by EmpId and Date.
 * Identifies:
 *   - First Punch In -> InTime, InLatitude, InLongitude, InLatLong, InAddress, InImage
 *   - Last Punch Out -> OutTime, OutLatitude, OutLongitude, OutLatLong, OutAddress, OutImage
 *   - Calculates TotalHours (working hours) = OutTime - InTime
 *   - Sets Status = 'Present'
 */
async function syncAttendance(db, targetEmpId = null, targetDate = null) {
  try {
    let sql = 'SELECT * FROM Activity';
    const params = [];
    const conditions = [];

    if (targetEmpId) {
      conditions.push('EmpId = ?');
      params.push(targetEmpId);
    }
    if (targetDate) {
      conditions.push('(Date = ? OR DATE(MobileDateTime) = ? OR DATE(create_time) = ? OR DATE(ServerDateTime) = ?)');
      params.push(targetDate, targetDate, targetDate, targetDate);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY id ASC';

    const [activities] = await db.query(sql, params);
    if (!activities || activities.length === 0) return 0;

    const byEmpDate = {};
    for (const act of activities) {
      const actDate = act.Date || 
        (act.MobileDateTime ? act.MobileDateTime.slice(0, 10) : null) || 
        (act.create_time ? act.create_time.slice(0, 10) : null) || 
        (act.ServerDateTime ? act.ServerDateTime.slice(0, 10) : null);

      if (!actDate) continue;
      const key = `${act.EmpId}###${actDate}`;
      if (!byEmpDate[key]) byEmpDate[key] = [];
      byEmpDate[key].push(act);
    }

    let syncedCount = 0;
    for (const [key, acts] of Object.entries(byEmpDate)) {
      const [empId, dateStr] = key.split('###');

      // Sort activities for this date chronologically
      acts.sort((a, b) => {
        const timeA = a.Time || (a.MobileDateTime ? a.MobileDateTime.slice(11, 19) : null) || (a.create_time ? a.create_time.slice(11, 19) : '00:00:00');
        const timeB = b.Time || (b.MobileDateTime ? b.MobileDateTime.slice(11, 19) : null) || (b.create_time ? b.create_time.slice(11, 19) : '00:00:00');
        return timeA.localeCompare(timeB);
      });

      let firstIn = null;
      let lastOut = null;

      for (const a of acts) {
        const ev = (a.Event || '').toString().toLowerCase();
        if (ev.includes('in') && !firstIn) {
          firstIn = a;
        }
        if (ev.includes('out')) {
          lastOut = a;
        }
      }

      // If no explicit 'in' event, first activity is considered first in
      if (!firstIn && acts.length > 0) {
        firstIn = acts[0];
      }

      // If there are multiple activities and no explicit 'out', but last activity was later in the day
      if (!lastOut && acts.length > 1) {
        const lastAct = acts[acts.length - 1];
        if (lastAct !== firstIn) {
          lastOut = lastAct;
        }
      }

      const inTime = firstIn ? (firstIn.Time || firstIn.MobileDateTime?.slice(11, 19) || firstIn.create_time?.slice(11, 19)) : null;
      const outTime = lastOut ? (lastOut.Time || lastOut.MobileDateTime?.slice(11, 19) || lastOut.create_time?.slice(11, 19)) : null;

      let totalHours = null;
      if (inTime && outTime) {
        totalHours = calculateWorkingHours(inTime, outTime);
      }

      const status = 'Present';
      const tenantId = firstIn?.Tenent_Id || (acts[0] ? acts[0].Tenent_Id : 1) || 1;

      const inLat = firstIn?.Latitude || (firstIn?.GeoLocation?.includes(',') ? parseFloat(firstIn.GeoLocation.split(',')[0]) : null);
      const inLon = firstIn?.Longitude || (firstIn?.GeoLocation?.includes(',') ? parseFloat(firstIn.GeoLocation.split(',')[1]) : null);
      const inLatLong = firstIn?.GeoLocation || (inLat && inLon ? `${inLat},${inLon}` : null);
      const inAddress = firstIn?.Address || null;
      const inImage = firstIn?.Image || null;

      const outLat = lastOut ? (lastOut.Latitude || (lastOut.GeoLocation?.includes(',') ? parseFloat(lastOut.GeoLocation.split(',')[0]) : null)) : null;
      const outLon = lastOut ? (lastOut.Longitude || (lastOut.GeoLocation?.includes(',') ? parseFloat(lastOut.GeoLocation.split(',')[1]) : null)) : null;
      const outLatLong = lastOut ? (lastOut.GeoLocation || (outLat && outLon ? `${outLat},${outLon}` : null)) : null;
      const outAddress = lastOut?.Address || null;
      const outImage = lastOut?.Image || null;

      // Check if row already exists in Attendance
      const [existing] = await db.query(
        'SELECT id, InTime, OutTime, TotalHours FROM Attendance WHERE EmpId = ? AND (Date = ? OR DateTime = ?) LIMIT 1',
        [empId, dateStr, dateStr]
      );

      if (existing && existing.length > 0) {
        const rowId = existing[0].id;
        await db.execute(
          `UPDATE Attendance SET
            Date = ?,
            DateTime = ?,
            InTime = COALESCE(?, InTime),
            OutTime = COALESCE(?, OutTime),
            TotalHours = COALESCE(?, TotalHours),
            Status = COALESCE(?, Status),
            InLatitude = COALESCE(?, InLatitude),
            InLongitude = COALESCE(?, InLongitude),
            InAddress = COALESCE(?, InAddress),
            InImage = COALESCE(?, InImage),
            OutLatitude = COALESCE(?, OutLatitude),
            OutLongitude = COALESCE(?, OutLongitude),
            OutAddress = COALESCE(?, OutAddress),
            OutImage = COALESCE(?, OutImage),
            InLatLong = COALESCE(?, InLatLong),
            OutLatLong = COALESCE(?, OutLatLong),
            InEvent = 'In',
            OutEvent = COALESCE(?, OutEvent),
            Tenent_Id = ?
          WHERE id = ?`,
          [
            dateStr,
            dateStr,
            inTime,
            outTime,
            totalHours,
            status,
            inLat,
            inLon,
            inAddress,
            inImage,
            outLat,
            outLon,
            outAddress,
            outImage,
            inLatLong,
            outLatLong,
            outTime ? 'Out' : null,
            tenantId,
            rowId
          ]
        );
      } else {
        await db.execute(
          `INSERT INTO Attendance (
            EmpId, Date, DateTime, InTime, OutTime, TotalHours, Status,
            InLatitude, InLongitude, InAddress, InImage,
            OutLatitude, OutLongitude, OutAddress, OutImage,
            InLatLong, OutLatLong, InEvent, OutEvent, Tenent_Id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            empId,
            dateStr,
            dateStr,
            inTime,
            outTime,
            totalHours,
            status,
            inLat,
            inLon,
            inAddress,
            inImage,
            outLat,
            outLon,
            outAddress,
            outImage,
            inLatLong,
            outLatLong,
            'In',
            outTime ? 'Out' : null,
            tenantId
          ]
        );
      }
      syncedCount++;
    }

    return syncedCount;
  } catch (err) {
    console.error('Error syncing Attendance from Activity:', err);
    throw err;
  }
}

module.exports = { syncAttendance };
