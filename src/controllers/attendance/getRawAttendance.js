const db = require('../../config/db');
const helpers = require('./attendanceHelper');
const { OFFICE_LAT, OFFICE_LON, calculateDistance, formatTimeAMPM, formatDateDDMMYYYY, calculateWorkingHours, saveBase64Image } = helpers;

const { syncAttendance } = require('./syncAttendance');

const getRawAttendance = async (req, res) => {
  const response = { success: false, message: '', data: null };

  try {
    // Sync latest Activity records into Attendance table so report is always up to date
    try {
      await syncAttendance(db);
    } catch (syncErr) {
      console.warn('Could not sync Attendance in getRawAttendance:', syncErr.message);
    }

    const [rows] = await db.query('SELECT * FROM Attendance ORDER BY Date DESC, InTime DESC');
    if (rows && rows.length > 0) {
      response.success = true;
      response.data = rows;
    } else {
      response.message = 'No attendance records found.';
    }
    return res.json(response);
  } catch (err) {
    console.error('Error in getRawAttendance:', err);
    response.message = `Database Error: ${err.message}`;
    return res.status(500).json(response);
  }
};

// 6. Get Today Attendance (src/attendance/get_today_attendance.php);

module.exports = getRawAttendance;
