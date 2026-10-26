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
      `SELECT DISTINCT EmpId FROM (
         SELECT EmpId FROM Activity WHERE (DATE(MobileDateTime) = ? OR Date = ?)
         UNION
         SELECT EmpId FROM Attendance WHERE (Date = ? OR DateTime = ?)
       ) AS combined_emps 
       ORDER BY EmpId ASC`,
      [inputDate, inputDate, inputDate, inputDate]
    );

    if (empRows && empRows.length > 0) {
      response.success = true;
      response.message = 'Distinct employees fetched.';
      response.data = [];

      for (const row of empRows) {
        const empId = row.EmpId;

        // Fetch activity events
        const [records] = await db.query(
          `SELECT ActivityId, EmpId, Event, GeoLocation, MobileDateTime, Time, Date 
           FROM Activity 
           WHERE EmpId = ? AND (DATE(MobileDateTime) = ? OR Date = ?) 
           ORDER BY COALESCE(MobileDateTime, CONCAT(Date, ' ', Time)) ASC`,
          [empId, inputDate, inputDate]
        );

        // Fetch attendance record
        const [attRows] = await db.query(
          `SELECT InTime, OutTime, InLatLong, OutLatLong, InEvent, OutEvent, TotalHours, Status 
           FROM Attendance 
           WHERE EmpId = ? AND (Date = ? OR DateTime = ?) 
           LIMIT 1`,
          [empId, inputDate, inputDate]
        );
        const att = attRows && attRows.length > 0 ? attRows[0] : null;

        let firstIn = null;
        let lastOut = null;

        if (records && records.length > 0) {
          for (const rec of records) {
            const ev = (rec.Event || '').toString().toLowerCase();
            if (ev.includes('in') && !firstIn) {
              firstIn = rec;
            }
            if (ev.includes('out')) {
              lastOut = rec;
            }
          }
        }

        // Format FirstIn
        let firstInTime = 'N/A';
        let firstInLoc = 'N/A';
        if (firstIn) {
          firstInTime = formatTimeAMPM(firstIn.MobileDateTime || firstIn.Time);
          firstInLoc = firstIn.GeoLocation || 'N/A';
        } else if (att && att.InTime) {
          firstInTime = formatTimeAMPM(att.InTime);
          firstInLoc = att.InLatLong || 'N/A';
        }

        // Format LastOut
        let lastOutTime = 'N/A';
        let lastOutLoc = 'N/A';
        if (lastOut) {
          lastOutTime = formatTimeAMPM(lastOut.MobileDateTime || lastOut.Time);
          lastOutLoc = lastOut.GeoLocation || 'N/A';
        } else if (att && att.OutTime) {
          lastOutTime = formatTimeAMPM(att.OutTime);
          lastOutLoc = att.OutLatLong || 'N/A';
        }

        // Calculate working hours
        let workingHours = 'N/A';
        if (att && att.TotalHours && att.TotalHours !== 'N/A') {
          workingHours = att.TotalHours;
        } else {
          const inVal = firstIn?.MobileDateTime || firstIn?.Time || att?.InTime;
          const outVal = lastOut?.MobileDateTime || lastOut?.Time || att?.OutTime;
          if (inVal && outVal) {
            workingHours = calculateWorkingHours(inVal, outVal);
          }
        }

        const firstEvent = firstIn ? firstIn.Event : (att?.InEvent || (records && records.length > 0 ? records[0].Event : 'In'));
        const lastEvent = lastOut ? lastOut.Event : (att?.OutEvent || (records && records.length > 0 ? records[records.length - 1].Event : (lastOutTime !== 'N/A' ? 'Out' : 'In')));

        response.data.push({
          EmpId: empId,
          Date: formatDateDDMMYYYY(inputDate),
          FirstIn: firstInTime,
          FirstInLocation: firstInLoc,
          LastOut: lastOutTime,
          LastOutLocation: lastOutLoc,
          WorkingHours: workingHours,
          FirstEvent: firstEvent || 'In',
          LastEvent: lastEvent || 'Out',
          Status: att?.Status || 'Present'
        });
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
