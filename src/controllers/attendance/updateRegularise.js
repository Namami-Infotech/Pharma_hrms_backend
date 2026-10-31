const db = require('../../config/db');
const helpers = require('./attendanceHelper');
const { OFFICE_LAT, OFFICE_LON, calculateDistance, formatTimeAMPM, formatDateDDMMYYYY, calculateWorkingHours, saveBase64Image } = helpers;

const updateRegularise = async (req, res) => {
  const response = { success: false, message: '' };
  const data = req.body || {};

  const rawId = data.RegID || data.id || data.Id;
  const RegID = rawId ? rawId.toString().trim() : null;
  const Status = data.Status ? data.Status.toString().trim() : null;
  const UpdatedBy = data.UpdatedBy ? data.UpdatedBy.toString().trim() : 'ADMIN';
  const InActivityId = data.InActivityId ? data.InActivityId.toString().trim() : 'N/A';
  const OutActivityId = data.OutActivityId ? data.OutActivityId.toString().trim() : (data.InActivityId ? data.InActivityId.toString().trim() : 'N/A');
  const inputDate = data.Date ? data.Date.toString().trim() : new Date().toISOString().split('T')[0];
  const inTimeStr = data.InTime ? data.InTime.toString().trim() : '09:00:00';
  const outTimeStr = data.OutTime ? data.OutTime.toString().trim() : '18:00:00';

  if (!RegID || !Status) {
    response.message = 'Missing required fields.';
    return res.json(response);
  }

  const newInTime = `${inputDate} ${inTimeStr}`;
  const newOutTime = `${inputDate} ${outTimeStr}`;
  const UpdateDate = new Date().toISOString().slice(0, 19).replace('T', ' ');

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    if (InActivityId !== 'N/A') {
      await conn.execute('UPDATE Attendance SET RegulariseStatus = 0 WHERE Id = ?', [InActivityId]);
    }

    if (OutActivityId !== 'N/A') {
      await conn.execute('UPDATE Attendance SET RegulariseStatus = 0 WHERE Id = ?', [OutActivityId]);
    }

    if (Status === 'Approved') {
      if (InActivityId !== 'N/A') {
        await conn.execute(
          'UPDATE Attendance SET InTime = ?, RegulariseStatus = 1 WHERE Id = ?',
          [newInTime, InActivityId]
        );
      }

      if (OutActivityId !== 'N/A') {
        const [attRows] = await conn.query('SELECT EmpId FROM Attendance WHERE Id = ?', [OutActivityId]);
        if (!attRows || attRows.length === 0) {
          throw new Error('Attendance record not found for ID: ' + OutActivityId);
        }

        const EmpId = attRows[0].EmpId;

        await conn.execute(
          'UPDATE Attendance SET OutTime = ?, RegulariseStatus = 1 WHERE Id = ?',
          [newOutTime, OutActivityId]
        );

        await conn.execute(
          `INSERT INTO Activity (EmpId, Event, GeoLocation, Distance, MobileDateTime, app_ver) 
           VALUES (?, 'Out', '0.00000,0.00000', 0, ?, 'Regularised')`,
          [EmpId, newOutTime]
        );
      }
    }

    await conn.execute(
      `UPDATE Regularisation 
       SET Status = ?, UpdateDate = ?, UpdatedBy = ?, RegID = COALESCE(RegID, ?) 
       WHERE RegID = ? OR id = ?`,
      [Status, UpdateDate, UpdatedBy, RegID, RegID, RegID]
    );

    await conn.commit();
    response.success = true;
    response.message = 'Regularisation processed successfully.';
    return res.json(response);
  } catch (err) {
    await conn.rollback();
    console.error('Error in updateRegularise:', err);
    response.message = err.message;
    return res.json(response);
  } finally {
    conn.release();
  }
};

// 12. Correct Activity (src/attendance/correct_activity.php);

module.exports = updateRegularise;
