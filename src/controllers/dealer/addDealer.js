const db = require('../../config/db');

const addDealer = async (req, res) => {
  const response = { success: false, message: '' };
  const data = req.body || {};

  const checkpointsData = data.checkpoints || {};
  const latLong = data.latLong || '';
  const addedByEmpId = data.addedByEmpId || data.empId || '';

  try {
    // 1. Fetch active checkpoints to validate mandatory fields
    const [checkpoints] = await db.query(
      `SELECT Id, Description, Mandatory FROM Checkpoints WHERE Active = 1 ORDER BY Id ASC`
    );

    // Validate mandatory fields
    for (const chk of checkpoints) {
      if (chk.Mandatory) {
        const val = checkpointsData[chk.Id] !== undefined ? checkpointsData[chk.Id] : data[chk.Description];
        if (val === undefined || String(val).trim() === '') {
          response.message = `Please provide required field: ${chk.Description}`;
          return res.json(response);
        }
      }
    }

    // Helper to get value by checkpoint ID or fallback key name
    const getVal = (chkId, fallbackNames) => {
      if (checkpointsData[chkId] !== undefined && checkpointsData[chkId] !== null) {
        return String(checkpointsData[chkId]);
      }
      for (const name of fallbackNames) {
        if (data[name] !== undefined && data[name] !== null) return String(data[name]);
        const foundKey = Object.keys(data).find(k => k.toLowerCase() === name.toLowerCase());
        if (foundKey && data[foundKey]) return String(data[foundKey]);
      }
      // Also check if any checkpoint whose description matches fallbackNames exists in checkpointsData
      const matchingChk = checkpoints.find(c => 
        fallbackNames.some(fn => c.Description.toLowerCase() === fn.toLowerCase() || c.Description.toLowerCase().includes(fn.toLowerCase()))
      );
      if (matchingChk && checkpointsData[matchingChk.Id] !== undefined && checkpointsData[matchingChk.Id] !== null) {
        return String(checkpointsData[matchingChk.Id]);
      }
      return '';
    };

    const companyName = getVal(1, ['companyName', 'Company Name', 'company']);
    const address = getVal(2, ['address', 'Address']);
    const dealerName = getVal(3, ['dealerName', 'Dealer Name', 'contactPerson', 'Contact Person']) || companyName;
    const contactInfo = getVal(4, ['contactInfo', 'Contact Info', 'phone', 'mobile']);
    const mailId = getVal(5, ['mailId', 'Mail Id', 'email', 'Email']);
    const remarks = getVal(6, ['remarks', 'Remarks']);

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Save to Dealers table for standard reporting & visits
      const [dealerResult] = await connection.execute(
        `INSERT INTO Dealers (DealerName, Address, ContactInfo, LatLong, CompanyName, MailId, Remarks, AddedByEmpId) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [dealerName, address, contactInfo, latLong, companyName, mailId, remarks, addedByEmpId]
      );

      const newDealerId = dealerResult.insertId;
      const activityId = `ACT_DLR_${newDealerId}_${Date.now()}`;

      // 2. Save to TransactionHDR (MenuId = 1)
      await connection.execute(
        `INSERT INTO TransactionHDR (MenuId, ActivityId, SRNo) VALUES (?, ?, ?)`,
        [1, activityId, newDealerId]
      );

      // 3. Save each dynamic checkpoint to TransactionDTL
      const dtlSql = `INSERT INTO TransactionDTL (ActivityId, ChkId, Value, LatLong, DateTime) VALUES (?, ?, ?, ?, NOW())`;

      for (const chk of checkpoints) {
        const val = checkpointsData[chk.Id] !== undefined ? checkpointsData[chk.Id] : (data[chk.Description] || '');
        await connection.execute(dtlSql, [activityId, chk.Id, String(val || ''), latLong]);
      }

      await connection.commit();
      response.success = true;
      response.message = 'Dealer added successfully.';
      response.data = { DealerID: newDealerId, ActivityId: activityId };
      return res.json(response);
    } catch (err) {
      await connection.rollback();
      console.error('Error in addDealer transaction:', err);
      response.message = `An error occurred: ${err.message}`;
      return res.status(500).json(response);
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('Error in addDealer:', err);
    response.message = `An error occurred: ${err.message}`;
    return res.status(500).json(response);
  }
};

module.exports = addDealer;
