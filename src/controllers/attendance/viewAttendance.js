const db = require('../../config/db');
const helpers = require('./attendanceHelper');
const { OFFICE_LAT, OFFICE_LON, calculateDistance, formatTimeAMPM, formatDateDDMMYYYY, calculateWorkingHours, saveBase64Image } = helpers;

const viewAttendance = async (req, res) => {
  const response = { success: false, message: '', data: [] };
  const role = req.query.role || null;
  const empId = req.query.EmpId || null;

  try {
    let sql = '';
    const params = [];

    if (role === 'HR') {
      sql = `SELECT ActivityId, DId, MappingId, EmpId, MenuId, LocationId, Event, GeoLocation, Distance, MobileDateTime, ServerDateTime 
             FROM Activity`;
    } else if (empId) {
      sql = `SELECT ActivityId, DId, MappingId, EmpId, MenuId, LocationId, Event, GeoLocation, Distance, MobileDateTime, ServerDateTime 
             FROM Activity WHERE EmpId = ?`;
      params.push(empId);
    } else {
      response.message = 'EmpId parameter is missing for non-HR role.';
      return res.json(response);
    }

    const [attendanceData] = await db.query(sql, params);

    if (attendanceData && attendanceData.length > 0) {
      response.success = true;

      const empWiseActivities = {};
      for (const activity of attendanceData) {
        const id = activity.EmpId;
        const origDate = new Date(activity.MobileDateTime);
        const adjustedDate = new Date(origDate.getTime());

        // Adjust date based on reset time (if hour < 4 modify -1 day)
        if (origDate.getHours() < 4) {
          adjustedDate.setDate(adjustedDate.getDate() - 1);
        }

        const dateKey = formatDateDDMMYYYY(adjustedDate);

        if (!empWiseActivities[id]) empWiseActivities[id] = {};
        if (!empWiseActivities[id][dateKey]) empWiseActivities[id][dateKey] = [];
        empWiseActivities[id][dateKey].push(activity);
      }

      const processedData = [];
      for (const [id, dateMap] of Object.entries(empWiseActivities)) {
        for (const [dateStr, activities] of Object.entries(dateMap)) {
          let firstIn = null;
          let lastOut = null;
          const firstEvent = activities[0].Event;
          const lastEvent = activities[activities.length - 1].Event;

          for (const act of activities) {
            if (act.Event.includes('In') && !firstIn) {
              firstIn = act;
            }
            if (act.Event.includes('Out')) {
              lastOut = act;
            }
          }

          let workingHours = 'N/A';
          if (firstIn && lastOut) {
            workingHours = calculateWorkingHours(firstIn.MobileDateTime, lastOut.MobileDateTime);
          }

          processedData.push({
            empId: id,
            date: dateStr,
            inActivityId: firstIn ? firstIn.ActivityId : 'N/A',
            outActivityId: lastOut ? lastOut.ActivityId : 'N/A',
            firstIn: firstIn ? formatTimeAMPM(firstIn.MobileDateTime) : 'N/A',
            firstInLocation: firstIn ? firstIn.GeoLocation : 'N/A',
            lastOut: lastOut ? formatTimeAMPM(lastOut.MobileDateTime) : 'N/A',
            lastOutLocation: lastOut ? lastOut.GeoLocation : 'N/A',
            workingHours,
            firstEvent,
            lastEvent
          });
        }
      }

      processedData.sort((a, b) => {
        const [d1, m1, y1] = a.date.split('/');
        const [d2, m2, y2] = b.date.split('/');
        return new Date(`${y2}-${m2}-${d2}`) - new Date(`${y1}-${m1}-${d1}`);
      });

      response.data = processedData;
    } else {
      response.message = 'No attendance records found.';
    }

    return res.json(response);
  } catch (err) {
    console.error('Error in viewAttendance:', err);
    response.message = `Error: ${err.message}`;
    return res.status(500).json(response);
  }
};

// 8. Batch Attendance Process (src/attendance/attendance.php);

module.exports = viewAttendance;
