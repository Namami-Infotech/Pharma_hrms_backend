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

    let attendanceRecords = [];
    try {
      const [rows] = await db.query(sql, params);
      attendanceRecords = rows || [];
    } catch (tblErr) {
      try {
        const [rows] = await db.query(sql.replace(/\bAttendance\b/g, 'attendance'), params);
        attendanceRecords = rows || [];
      } catch (tblErr2) {
        console.warn('Could not query Attendance/attendance table:', tblErr2.message);
      }
    }

    if (attendanceRecords && attendanceRecords.length > 0) {
      const formattedRecords = attendanceRecords.map(record => {
        // Correct date column: Date or DateTime or create_time
        const rawDate = record.Date || record.DateTime || record.create_time;
        const dateStr = formatDateDDMMYYYY(rawDate);
        const firstIn = formatTimeAMPM(record.InTime);
        const firstInLocation = record.InLatLong || 'N/A';
        const inActivityId = record.id ?? record.Id ?? 'N/A';

        const lastOut = formatTimeAMPM(record.OutTime);
        const lastOutLocation = record.OutLatLong || 'N/A';
        const outActivityId = record.OutTime ? (record.id ?? record.Id ?? 'N/A') : 'N/A';

        let workingHours = record.TotalHours && record.TotalHours !== 'N/A' 
          ? record.TotalHours 
          : calculateWorkingHours(record.InTime, record.OutTime);

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
          lastEvent: record.OutEvent || 'Out',
          status: record.RegulariseStatus ?? 0
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
