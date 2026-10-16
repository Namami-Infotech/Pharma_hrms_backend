const db = require('../../config/db');
const { getDrivingDistance } = require('./visitHelper');

const markVisit = async (req, res) => {
  const response = { success: false, message: '' };
  const data = req.body || {};

  const empId = data.empId || '';
  const dealerId = data.dealerId || '';
  const dealerName = data.dealerName || '';
  const visitLatLong = data.visitLatLong || '';
  const status = data.status || '';
  const planVisit = data.planVisit || null;
  const old_visit = data.old_visit || null;
  const companyName = data.companyName || '';
  const mobileNo = data.mobileNo || '';
  const mode = data.mode || '';
  const purpose = data.purpose || '';
  const remarks = data.remarks || '';
  const attachment = data.attachment || null;

  if (!empId || !dealerId || !dealerName || !visitLatLong || !status) {
    response.message = 'Please provide empId, dealerId, dealerName, visitLatLong, and status.';
    return res.json(response);
  }

  try {
    const [countRows] = await db.query(
      `SELECT COUNT(*) as visitCount 
       FROM Visit 
       WHERE EmpId = ? AND DATE(VisitTime) = CURDATE()`,
      [empId]
    );

    const visitCount = countRows[0].visitCount || 0;
    const nextVisitAlphabet = String.fromCharCode(65 + visitCount);

    const insertSql = `
      INSERT INTO Visit 
      (EmpId, DealerID, DealerName, VisitCount, VisitLatLong, VisitTime, Status, Plan_Visit, CompanyName, MobileNo, Mode, Purpose, Remarks, Attachment, old_visit) 
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await db.execute(insertSql, [
      empId,
      dealerId,
      dealerName,
      nextVisitAlphabet,
      visitLatLong,
      status,
      planVisit,
      companyName,
      mobileNo,
      mode,
      purpose,
      remarks,
      attachment,
      old_visit
    ]);

    response.success = true;
    response.message = `Visit added successfully with count ${nextVisitAlphabet}.`;
    return res.json(response);
  } catch (err) {
    console.error('Error in markVisit:', err);
    response.message = `An error occurred: ${err.message}`;
    return res.status(500).json(response);
  }
};

// 2. Get Visits Entry (src/visit/get_visits_entry.php);

module.exports = markVisit;
