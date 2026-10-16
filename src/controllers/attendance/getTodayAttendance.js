const db = require('../../config/db');
const helpers = require('./attendanceHelper');
const { OFFICE_LAT, OFFICE_LON, calculateDistance, formatTimeAMPM, formatDateDDMMYYYY, calculateWorkingHours, saveBase64Image } = helpers;

const getTodayAttendance = async (req, res) => {
  const response = { success: false, message: '', data: [] };

  try {
    let inputDate = (req.query.date || '').toString().trim();

    if (inputDate && isNaN(new Date(inputDate).getTime())) {
      response.message = 'Invalid date format. Use YYYY-MM-DD.';
      return res.json(response);
    }

    if (!inputDate) {
      inputDate = new Date().toISOString().slice(0, 10);
    }

    const [empRows] = await db.query(
      `SELECT DISTINCT EmpId FROM Activity 
       WHERE DATE(MobileDateTime) = ? 
       ORDER BY EmpId ASC`,
      [inputDate]
    );

    if (empRows && empRows.length > 0) {
      response.success = true;
      response.message = 'Distinct employees fetched.';
      response.data = [];

      for (const row of empRows) {
        const empId = row.EmpId;
        const [records] = await db.query(
          `SELECT ActivityId, EmpId, Event, GeoLocation, MobileDateTime 
           FROM Activity 
           WHERE EmpId = ? AND DATE(MobileDateTime) = ? 
           ORDER BY MobileDateTime ASC`,
          [empId, inputDate]
        );

        if (records && records.length > 0) {
          let firstIn = null;
          let lastOut = null;

          for (const rec of records) {
            if (rec.Event.includes('In') && !firstIn) {
              firstIn = rec;
            }
            if (rec.Event.includes('Out')) {
              lastOut = rec;
            }
          }

          let workingHours = 'N/A';
          if (firstIn && lastOut) {
            workingHours = calculateWorkingHours(firstIn.MobileDateTime, lastOut.MobileDateTime);
          }

          response.data.push({
            EmpId: empId,
            Date: formatDateDDMMYYYY(inputDate),
            FirstIn: firstIn ? formatTimeAMPM(firstIn.MobileDateTime) : 'N/A',
            FirstInLocation: firstIn ? firstIn.GeoLocation : 'N/A',
            LastOut: lastOut ? formatTimeAMPM(lastOut.MobileDateTime) : 'N/A',
            LastOutLocation: lastOut ? lastOut.GeoLocation : 'N/A',
            WorkingHours: workingHours,
            FirstEvent: records[0].Event,
            LastEvent: records[records.length - 1].Event
          });
        }
      }
    } else {
      response.message = 'No attendance found for this date.';
    }

    return res.json(response);
  } catch (err) {
    console.error('Error in getTodayAttendance:', err);
    response.message = `Error: ${err.message}`;
    return res.status(500).json(response);
  }
};

// 7. View Attendance (src/attendance/view_attendance.php);

module.exports = getTodayAttendance;
