const db = require('../../config/db');
const { getDrivingDistance } = require('./visitHelper');

const processVisitsEntry = async (req, res) => {
  const response = { success: false, message: '', data: [] };
  const today = new Date().toISOString().slice(0, 10);

  try {
    const [attendanceRecords] = await db.query(
      `SELECT EmpId, InTime, InLatLong, OutTime, OutLatLong 
       FROM Attendance 
       WHERE DATE(InTime) = ? OR DATE(OutTime) = ? 
       ORDER BY InTime`,
      [today, today]
    );

    if (!attendanceRecords || attendanceRecords.length === 0) {
      response.message = 'No attendance records found for today.';
      return res.json(response);
    }

    const [visitRecords] = await db.query(
      `SELECT EmpId, VisitTime, VisitLatLong, DealerName 
       FROM Visit 
       WHERE DATE(VisitTime) = ? 
       ORDER BY VisitTime`,
      [today]
    );

    for (const attendance of attendanceRecords) {
      const empId = attendance.EmpId;
      const sourceLatLong = attendance.InLatLong;
      const sourceTime = attendance.InTime;
      const destinationLatLong = attendance.OutLatLong;
      const destinationTime = attendance.OutTime;

      const employeeVisits = visitRecords
        .filter(v => v.EmpId === empId)
        .sort((a, b) => new Date(a.VisitTime) - new Date(b.VisitTime));

      const combinedRecords = [];
      combinedRecords.push({
        LatLong: sourceLatLong,
        Time: sourceTime,
        Event: 'Attendance In'
      });

      for (const v of employeeVisits) {
        combinedRecords.push({
          LatLong: v.VisitLatLong,
          Time: v.VisitTime,
          Event: v.DealerName || 'Visit'
        });
      }

      combinedRecords.push({
        LatLong: destinationLatLong,
        Time: destinationTime,
        Event: 'Attendance Out'
      });

      for (let i = 0; i < combinedRecords.length - 1; i++) {
        const source = combinedRecords[i];
        const dest = combinedRecords[i + 1];

        const distance = await getDrivingDistance(source.LatLong, dest.LatLong);

        const insertSql = `
          INSERT INTO Visits 
          (EmpId, SourceLatLong, SourceTime, DestinationLatLong, DestinationTime, Distance, VisitDateTime, SourceEvent, DestinationEvent) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await db.execute(insertSql, [
          empId,
          source.LatLong,
          source.Time,
          dest.LatLong,
          dest.Time,
          distance,
          dest.Time,
          source.Event,
          dest.Event
        ]);
      }
    }

    response.success = true;
    response.message = 'Records processed and inserted successfully.';
    return res.json(response);
  } catch (err) {
    console.error('Error in processVisitsEntry:', err);
    response.message = `Database Error: ${err.message}`;
    return res.status(500).json(response);
  }
};

module.exports = processVisitsEntry;
