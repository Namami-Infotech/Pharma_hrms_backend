const db = require('../../config/db');
const helpers = require('./attendanceHelper');
const { OFFICE_LAT, OFFICE_LON, calculateDistance, formatTimeAMPM, formatDateDDMMYYYY, calculateWorkingHours, saveBase64Image } = helpers;

const applyRegularise = async (req, res) => {
  const response = { success: false, message: '' };
  const data = req.body || {};

  const EmpId = data.EmpId;
  const DateVal = data.Date;
  const InTime = data.InTime;
  const OutTime = data.OutTime;
  const Reason = data.Reason;
  const InActivityId = data.InActivityId;
  const OutActivityId = data.OutActivityId || data.InActivityId;

  if (EmpId && DateVal && InTime && OutTime && Reason) {
    try {
      const sql = `
        INSERT INTO Regularisation (EmpId, Date, InTime, OutTime, Reason, InActivityId, OutActivityId) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      await db.execute(sql, [
        EmpId,
        DateVal,
        InTime,
        OutTime,
        Reason,
        InActivityId,
        OutActivityId
      ]);

      response.success = true;
      response.message = 'Regularisation request submitted successfully.';
    } catch (err) {
      console.error('Error in applyRegularise:', err);
      response.message = `Failed to submit regularisation request: ${err.message}`;
    }
  } else {
    response.message = 'Missing required fields.';
  }

  return res.json(response);
};

// 10. Get Regularise (src/attendance/get_regularise.php);

module.exports = applyRegularise;
