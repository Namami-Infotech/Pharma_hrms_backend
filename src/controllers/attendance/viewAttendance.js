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

    const isAdmin = role === 'Admin' || role === 'admin' || role === 'SuperAdmin';
    const isRM = req.query.is_rm === 'true' || req.query.isRM === 'true';
    const rmEmpId = req.query.rmEmpId || (isRM && !empId ? req.query.EmpId : null);

    if (empId) {
      if (req.query.includeTeam === 'true') {
        sql = `SELECT * FROM Activity WHERE EmpId = ? OR EmpId IN (SELECT EmpId FROM Employees WHERE RM = ? OR RM = (SELECT Name FROM Employees WHERE EmpId = ? LIMIT 1))`;
        params.push(empId, empId, empId);
      } else {
        sql = `SELECT * FROM Activity WHERE EmpId = ?`;
        params.push(empId);
      }
    } else if (isAdmin) {
      sql = `SELECT * FROM Activity`;
    } else if (rmEmpId) {
      sql = `SELECT * FROM Activity WHERE EmpId = ? OR EmpId IN (SELECT EmpId FROM Employees WHERE RM = ? OR RM = (SELECT Name FROM Employees WHERE EmpId = ? LIMIT 1))`;
      params.push(rmEmpId, rmEmpId, rmEmpId);
    } else {
      response.message = 'EmpId parameter is missing for non-Admin role.';
      return res.json(response);
    }

    let attendanceData = [];
    try {
      const [rows] = await db.query(sql, params);
      attendanceData = rows || [];
    } catch (actErr) {
      try {
        const [rows] = await db.query(sql.replace(/\bActivity\b/g, 'activity'), params);
        attendanceData = rows || [];
      } catch (actErr2) {
        console.warn('Could not query Activity/activity table:', actErr2.message);
      }
    }

    // Also query Attendance table to include any records from Attendance table
    let attSql = 'SELECT * FROM Attendance';
    const attParams = [];
    if (empId) {
      if (req.query.includeTeam === 'true') {
        attSql += ' WHERE EmpId = ? OR EmpId IN (SELECT EmpId FROM Employees WHERE RM = ? OR RM = (SELECT Name FROM Employees WHERE EmpId = ? LIMIT 1))';
        attParams.push(empId, empId, empId);
      } else {
        attSql += ' WHERE EmpId = ?';
        attParams.push(empId);
      }
    } else if (isAdmin) {
      // All attendance records
    } else if (rmEmpId) {
      attSql += ' WHERE EmpId = ? OR EmpId IN (SELECT EmpId FROM Employees WHERE RM = ? OR RM = (SELECT Name FROM Employees WHERE EmpId = ? LIMIT 1))';
      attParams.push(rmEmpId, rmEmpId, rmEmpId);
    }
    let attData = [];
    try {
      const [rows] = await db.query(attSql, attParams);
      attData = rows || [];
    } catch (attErr) {
      try {
        const [rows] = await db.query(attSql.replace(/\bAttendance\b/g, 'attendance'), attParams);
        attData = rows || [];
      } catch (attErr2) {
        console.warn('Could not query Attendance/attendance table:', attErr2.message);
      }
    }

    const empWiseActivities = {};
    if (attendanceData && attendanceData.length > 0) {
      for (const activity of attendanceData) {
        const id = activity.EmpId;
        const rawDate = activity.MobileDateTime || (activity.Date ? `${activity.Date} ${activity.Time || '00:00:00'}` : null);
        if (!rawDate) continue;

        const origDate = new Date(rawDate);
        const adjustedDate = !isNaN(origDate.getTime()) ? new Date(origDate.getTime()) : null;

        // Adjust date based on reset time (if hour < 4 modify -1 day)
        if (adjustedDate && adjustedDate.getHours() < 4) {
          adjustedDate.setDate(adjustedDate.getDate() - 1);
        }

        const dateKey = adjustedDate ? formatDateDDMMYYYY(adjustedDate) : (activity.Date ? formatDateDDMMYYYY(activity.Date) : null);
        if (!dateKey || dateKey === 'N/A') continue;

        if (!empWiseActivities[id]) empWiseActivities[id] = {};
        if (!empWiseActivities[id][dateKey]) empWiseActivities[id][dateKey] = [];
        empWiseActivities[id][dateKey].push(activity);
      }
    }

    const processedData = [];
    for (const [id, dateMap] of Object.entries(empWiseActivities)) {
      for (const [dateStr, activities] of Object.entries(dateMap)) {
        let firstIn = null;
        let lastOut = null;
        const firstEvent = activities[0].Event;
        const lastEvent = activities[activities.length - 1].Event;

        for (const act of activities) {
          const ev = (act.Event || '').toString().toLowerCase();
          if (ev.includes('in') && !firstIn) {
            firstIn = act;
          }
          if (ev.includes('out')) {
            lastOut = act;
          }
        }

        let workingHours = 'N/A';
        const inTimeVal = firstIn?.MobileDateTime || firstIn?.Time;
        const outTimeVal = lastOut?.MobileDateTime || lastOut?.Time;
        if (inTimeVal && outTimeVal) {
          workingHours = calculateWorkingHours(inTimeVal, outTimeVal);
        }

        processedData.push({
          empId: id,
          date: dateStr,
          inActivityId: firstIn ? firstIn.ActivityId : 'N/A',
          outActivityId: lastOut ? lastOut.ActivityId : 'N/A',
          firstIn: firstIn ? formatTimeAMPM(firstIn.MobileDateTime || firstIn.Time) : 'N/A',
          firstInLocation: firstIn ? firstIn.GeoLocation : 'N/A',
          lastOut: lastOut ? formatTimeAMPM(lastOut.MobileDateTime || lastOut.Time) : 'N/A',
          lastOutLocation: lastOut ? lastOut.GeoLocation : 'N/A',
          workingHours,
          firstEvent: firstEvent || 'In',
          lastEvent: lastEvent || 'Out'
        });
      }
    }

    console.log(processedData, "aSsASAsaSAsas")

    // Merge Attendance table records if not already in processedData
    if (attData && attData.length > 0) {
      for (const att of attData) {
        const id = att.EmpId;
        const rawDate = att.Date || att.DateTime;
        if (!rawDate) continue;
        const dateStr = formatDateDDMMYYYY(rawDate);
        if (!dateStr || dateStr === 'N/A') continue;

        const existing = processedData.find(p => p.empId === id && p.date === dateStr);
        console.log("existing", existing)
        if (!existing) {
          const firstInTime = att.InTime ? formatTimeAMPM(att.InTime) : 'N/A';
          const lastOutTime = att.OutTime ? formatTimeAMPM(att.OutTime) : 'N/A';
          console.log("firstInTime1", firstInTime)
          console.log("lastOutTime1", lastOutTime)
          let wh = att.TotalHours && att.TotalHours !== 'N/A' ? att.TotalHours : 'N/A';
          console.log("wh1", wh)
          if (wh === 'N/A' && att.InTime && att.OutTime) {
            wh = calculateWorkingHours(att.InTime, att.OutTime);
          }

          processedData.push({
            empId: id,
            date: dateStr,
            inActivityId: att.id || 'N/A',
            outActivityId: att.id || 'N/A',
            firstIn: firstInTime,
            firstInLocation: att.InLatLong || 'N/A',
            lastOut: lastOutTime,
            lastOutLocation: att.OutLatLong || 'N/A',
            workingHours: wh,
            firstEvent: att.InEvent || 'In',
            lastEvent: att.OutEvent || 'Out'
          });
        } else {
          // Fill in any missing details from Attendance table
          if (existing.workingHours === 'N/A' && att.TotalHours && att.TotalHours !== 'N/A') {
            existing.workingHours = att.TotalHours;
          }
          if (existing.firstIn === 'N/A' && att.InTime) {
            existing.firstIn = formatTimeAMPM(att.InTime);
            existing.firstInLocation = att.InLatLong || 'N/A';
          }
          if (existing.lastOut === 'N/A' && att.OutTime) {
            existing.lastOut = formatTimeAMPM(att.OutTime);
            existing.lastOutLocation = att.OutLatLong || 'N/A';
          }
        }
      }
    }

    if (processedData.length > 0) {
      processedData.sort((a, b) => {
        const [d1, m1, y1] = a.date.split('/');
        const [d2, m2, y2] = b.date.split('/');
        return new Date(`${y2}-${m2}-${d2}`) - new Date(`${y1}-${m1}-${d1}`);
      });

      response.success = true;
      response.data = processedData;
    } else {
      response.message = 'No attendance records found.';
    }
    console.log("processedData", processedData)
    return res.json(response);
  } catch (err) {
    console.error('Error in viewAttendance:', err);
    response.message = `Error: ${err.message}`;
    return res.status(500).json(response);
  }
};

// 8. Batch Attendance Process (src/attendance/attendance.php);

module.exports = viewAttendance;
