const db = require('../../config/db');

const createVisit = async (req, res) => {
  const response = { success: false, message: '' };
  const data = req.body || {};

  const empId = data.empId || data.EmpId || '';
  const dealerId = data.dealerId || data.DealerID || '';
  let dealerName = data.dealerName || data.DealerName || '';
  let companyName = data.companyName || data.CompanyName || '';
  let mobileNo = data.mobileNo || data.MobileNo || '';
  const planVisit = data.planVisit || data.Plan_Visit || data.date || null;
  const purpose = data.purpose || data.Purpose || '';
  const remarks = data.remarks || data.Remarks || '';
  const mode = data.mode || data.Mode || 'Field Visit';
  const status = data.status || data.Status || 'Planned';
  const visitLatLong = data.visitLatLong || data.latLong || '';

  if (!empId || (!dealerId && !dealerName)) {
    response.message = 'Please provide employee ID (empId) and dealer information (dealerId/dealerName).';
    return res.status(400).json(response);
  }

  try {
    // If dealerId is provided but dealerName is empty, fetch dealerName & companyName from Dealers table
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

    const insertSql = `
      INSERT INTO Visit 
      (EmpId, DealerID, DealerName, CompanyName, MobileNo, Plan_Visit, VisitTime, Status, Mode, Purpose, Remarks, VisitLatLong, create_time)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;

    const [result] = await db.execute(insertSql, [
      empId,
      dealerId || null,
      dealerName,
      companyName,
      mobileNo,
      planVisit,
      status,
      mode,
      purpose,
      remarks,
      visitLatLong
    ]);

    response.success = true;
    response.message = 'Visit created successfully.';
    response.data = {
      VisitID: result.insertId,
      EmpId: empId,
      DealerID: dealerId,
      DealerName: dealerName,
      Plan_Visit: planVisit,
      Status: status
    };

    return res.json(response);
  } catch (err) {
    console.error('Error in createVisit:', err);
    response.message = `An error occurred: ${err.message}`;
    return res.status(500).json(response);
  }
};

module.exports = createVisit;
