const db = require('../../config/db');
const helpers = require('./attendanceHelper');
const { OFFICE_LAT, OFFICE_LON, calculateDistance, formatTimeAMPM, formatDateDDMMYYYY, calculateWorkingHours, saveBase64Image } = helpers;

const getMobileAttendance = async (req, res) => {
  const response = { success: false, message: '', data: [] };
  const empId = req.query.EmpId || null;

  try {
    let sql = 'SELECT * FROM Attendance ORDER BY InTime DESC';
    const params = [];

    if (empId) {
      sql = 'SELECT * FROM Attendance WHERE EmpId = ? ORDER BY InTime DESC';
      params.push(empId);
    }

    const [attendanceRecords] = await db.query(sql, params);

    if (attendanceRecords && attendanceRecords.length > 0) {
      const formattedRecords = attendanceRecords.map(record => {
        const rawDate = record.InTime || record.OutTime || new Date();
        const dateStr = formatDateDDMMYYYY(rawDate);
        const firstIn = formatTimeAMPM(record.InTime);
        const firstInLocation = record.InLatLong || 'N/A';
        const inActivityId = record.Id || 'N/A';

        const lastOut = formatTimeAMPM(record.OutTime);
        const lastOutLocation = record.OutLatLong || 'N/A';
        const outActivityId = record.OutTime ? record.Id : 'N/A';

        const workingHours = calculateWorkingHours(record.InTime, record.OutTime);

        return {
          empId: record.EmpId,
          date: dateStr,
          inActivityId,
          outActivityId,
          firstIn,
          firstInLocation,
          lastOut,
          lastOutLocation,
          workingHours,
          firstEvent: record.InEvent || 'In',
          lastEvent: record.OutEvent || 'In',
          status: record.RegulariseStatus
        };
      });

      response.success = true;
      response.data = formattedRecords;
    } else {
      response.message = 'No attendance records found.';
    }

    return res.json(response);
  } catch (err) {
    console.error('Error in getMobileAttendance:', err);
    response.message = `Error: ${err.message}`;
    return res.status(500).json(response);
  }
};

// 4. Mark Manual Attendance (src/attendance/mark_manual_attendance.php);

module.exports = getMobileAttendance;
