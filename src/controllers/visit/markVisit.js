const db = require('../../config/db');

const markVisit = async (req, res) => {
  const response = { success: false, message: '' };
  const data = req.body || {};

  const empId = data.empId || data.EmpId || '';
  const dealerId = data.dealerId || data.DealerID || '';
  let dealerName = data.dealerName || data.DealerName || '';
  let companyName = data.companyName || data.CompanyName || '';
  let mobileNo = data.mobileNo || data.MobileNo || '';
  const visitLatLong = data.visitLatLong || data.latLong || '';
  const status = data.status || data.Status || 'Completed';
  const planVisit = data.planVisit || data.Plan_Visit || null;
  const old_visit = data.old_visit || data.oldVisit || data.visitId || null;
  const mode = data.mode || data.Mode || 'Field Visit';
  const purpose = data.purpose || data.Purpose || 'Dealer Visit';
  const remarks = data.remarks || data.Remarks || '';
  const attachment = data.attachment || data.Attachment || null;

  if (!empId || (!dealerId && !dealerName) || !visitLatLong) {
    response.message = 'Please provide empId, dealerId/dealerName, and visitLatLong.';
    return res.status(400).json(response);
  }

  try {
    // If dealerId is provided but dealerName is missing, fetch from Dealers table
    if (dealerId && (!dealerName || !companyName)) {
      const [dealerRows] = await db.query(
        'SELECT DealerName, CompanyName, ContactInfo FROM Dealers WHERE DealerID = ?',
        [dealerId]
      );
      if (dealerRows && dealerRows.length > 0) {
        dealerName = dealerName || dealerRows[0].DealerName;
        companyName = companyName || dealerRows[0].CompanyName;
        mobileNo = mobileNo || dealerRows[0].ContactInfo;
      }
    }

    // Calculate daily visit count alphabet (A, B, C...)
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
      (EmpId, DealerID, DealerName, VisitCount, VisitLatLong, VisitTime, Status, Plan_Visit, CompanyName, MobileNo, Mode, Purpose, Remarks, Attachment, old_visit, create_time) 
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;

    const [result] = await db.execute(insertSql, [
      empId,
      dealerId || null,
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

    // If completing an existing planned visit, update its status as Completed
    if (old_visit) {
      await db.execute('UPDATE Visit SET Status = ? WHERE VisitID = ?', ['Completed', old_visit]);
    }

    response.success = true;
    response.message = `Visit marked as completed successfully (Visit Count ${nextVisitAlphabet}).`;
    response.data = {
      VisitID: result.insertId,
      EmpId: empId,
      DealerID: dealerId,
      DealerName: dealerName,
      VisitCount: nextVisitAlphabet,
      VisitLatLong: visitLatLong,
      Status: status,
      VisitTime: new Date().toISOString()
    };

    return res.json(response);
  } catch (err) {
    console.error('Error in markVisit:', err);
    response.message = `An error occurred: ${err.message}`;
    return res.status(500).json(response);
  }
};

module.exports = markVisit;
