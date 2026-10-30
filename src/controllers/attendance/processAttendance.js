const db = require('../../config/db');
const helpers = require('./attendanceHelper');
const { OFFICE_LAT, OFFICE_LON, calculateDistance, formatTimeAMPM, formatDateDDMMYYYY, calculateWorkingHours, saveBase64Image } = helpers;

const processAttendance = async (req, res) => {
  const response = { success: false, message: '', data: [] };
  const isAdmin = ['Admin', 'admin', 'SuperAdmin'].includes(role);

  if (!isAdmin) {
    response.message = 'Unauthorized access. Only Admin can perform this action.';
    return res.json(response);
  }

  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStart = `${yesterday.toISOString().slice(0, 10)} 06:00:00`;
    const todayEnd = `${new Date().toISOString().slice(0, 10)} 05:55:00`;

    const [attendanceData] = await db.query(
      `SELECT EmpId, MobileDateTime, GeoLocation, Event 
       FROM Activity 
       WHERE MobileDateTime BETWEEN ? AND ?`,
      [yesterdayStart, todayEnd]
    );

    if (attendanceData && attendanceData.length > 0) {
      const attendanceMap = {};

      for (const act of attendanceData) {
        const empId = act.EmpId;
        const eventTime = act.MobileDateTime;
        const geoLocation = act.GeoLocation;
        const event = act.Event;

        if (!attendanceMap[empId]) {
          attendanceMap[empId] = {
            inTime: null,
            inLatLong: null,
            inEvent: null,
            outTime: null,
            outLatLong: null,
            outEvent: null
          };
        }

        const evLower = (event || '').toLowerCase();
        if (evLower.includes('in') && attendanceMap[empId].inTime === null) {
          attendanceMap[empId].inTime = eventTime;
          attendanceMap[empId].inLatLong = geoLocation;
          attendanceMap[empId].inEvent = event;
        } else if (evLower.includes('out')) {
          attendanceMap[empId].outTime = eventTime;
          attendanceMap[empId].outLatLong = geoLocation;
          attendanceMap[empId].outEvent = event;
        }
      }

      const insertSql = `
        INSERT INTO Attendance (EmpId, InTime, InLatLong, InEvent, OutTime, OutLatLong, OutEvent, DateTime) 
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP) 
        ON DUPLICATE KEY UPDATE 
        InTime = VALUES(InTime), InLatLong = VALUES(InLatLong), InEvent = VALUES(InEvent), 
        OutTime = VALUES(OutTime), OutLatLong = VALUES(OutLatLong), OutEvent = VALUES(OutEvent)
      `;

      for (const [empId, att] of Object.entries(attendanceMap)) {
        if (att.inTime !== null || att.outTime !== null) {
          await db.execute(insertSql, [
            empId,
            att.inTime,
            att.inLatLong,
            att.inEvent,
            att.outTime,
            att.outLatLong,
            att.outEvent
          ]);
        }
      }

      response.success = true;
      response.message = 'Attendance records processed and inserted successfully with InEvent and OutEvent.';
    } else {
      response.message = 'No activity records found for the specified time range.';
    }

    return res.json(response);
  } catch (err) {
    console.error('Error in processAttendance:', err);
    response.message = `Error: ${err.message}`;
    return res.status(500).json(response);
  }
};

// 9. Regularise (src/attendance/regularise.php);

module.exports = processAttendance;
