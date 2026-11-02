const { pool } = require('../../config/db');

const addTransaction = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const input = req.body || {};
    const menuId = input.menuId !== undefined ? input.menuId : null;
    const activityId = input.ActivityId !== undefined ? input.ActivityId : null;
    const latLong = input.LatLong !== undefined ? input.LatLong : null;
    const dateTime = input.DateTime !== undefined ? input.DateTime : null;
    const chkData = input.data !== undefined ? input.data : {};

    if (!menuId || !activityId || !chkData || typeof chkData !== 'object' || Object.keys(chkData).length === 0) {
      connection.release();
      return res.json({ success: false, message: 'Invalid input data.', data: [] });
    }

    await connection.beginTransaction();

    let srNo = null;

    // If MenuId is 1 (Dealer Registration), sync to Dealers table
    if (Number(menuId) === 1) {
      try {
        const [checkpoints] = await connection.query(
          'SELECT Id, Description FROM Checkpoints WHERE Active = 1'
        );
        const chkMap = {};
        checkpoints.forEach(c => { chkMap[c.Id] = (c.Description || '').toLowerCase(); });

        let companyName = '';
        let address = '';
        let dealerName = '';
        let contactInfo = '';
        let mailId = '';
        let remarks = '';

        for (const [cId, val] of Object.entries(chkData)) {
          const desc = chkMap[cId] || '';
          const sVal = String(val !== undefined && val !== null ? val : '').trim();
          if (desc.includes('company') || cId == '1') companyName = companyName || sVal;
          else if (desc.includes('address') || cId == '2') address = address || sVal;
          else if (desc.includes('dealer') || desc.includes('person') || desc.includes('name') || cId == '3') dealerName = dealerName || sVal;
          else if (desc.includes('contact') || desc.includes('phone') || desc.includes('mobile') || cId == '4') contactInfo = contactInfo || sVal;
          else if (desc.includes('mail') || desc.includes('email') || cId == '5') mailId = mailId || sVal;
          else if (desc.includes('remark') || cId == '6') remarks = remarks || sVal;
        }

        if (!dealerName && companyName) dealerName = companyName;
        if (!companyName && dealerName) companyName = dealerName;

        const empIdMatch = activityId ? activityId.match(/[A-Za-z0-9]+$/) : null;
        const addedBy = input.addedByEmpId || input.empId || input.userId || (empIdMatch ? empIdMatch[0] : '');

        const [dealerRes] = await connection.query(
          `INSERT INTO Dealers (DealerName, Address, ContactInfo, LatLong, CompanyName, MailId, Remarks, AddedByEmpId) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [dealerName, address, contactInfo, latLong || '', companyName, mailId, remarks, addedBy]
        );
        srNo = dealerRes.insertId;
      } catch (dealerInsertErr) {
        console.warn('Note: Failed to sync dealer to Dealers table in addTransaction:', dealerInsertErr.message);
      }
    }

    const [hdrRes] = await connection.query(
      'INSERT INTO TransactionHDR (MenuId, ActivityId, SRNo) VALUES (?, ?, ?)',
      [menuId, activityId, srNo]
    );

    if (!srNo && hdrRes && hdrRes.insertId) {
      srNo = hdrRes.insertId;
      await connection.query('UPDATE TransactionHDR SET SRNo = ? WHERE Id = ?', [srNo, hdrRes.insertId]);
    }

    const dtlSql = 'INSERT INTO TransactionDTL (ActivityId, ChkId, Value, LatLong, DateTime) VALUES (?, ?, ?, ?, ?)';

    for (const [chkId, value] of Object.entries(chkData)) {
      await connection.query(dtlSql, [activityId, chkId, value, latLong, dateTime]);
    }

    await connection.commit();
    connection.release();

    return res.json({
      success: true,
      message: 'Transaction recorded successfully.',
      data: { ActivityId: activityId }
    });
  } catch (err) {
    try {
      await connection.rollback();
    } catch (rbErr) {}
    connection.release();
    return res.json({ success: false, message: 'Error: ' + err.message, data: [] });
  }
};

// GET /src/menu/get_checkpoints.php;

module.exports = addTransaction;
