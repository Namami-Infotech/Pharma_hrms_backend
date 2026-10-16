const db = require('../../config/db');

const getDealers = async (req, res) => {
  const response = { success: false, message: '', data: [] };

  try {
    const [rows] = await db.query(
      `SELECT TH.SRNo AS DealerID, TH.ActivityId 
       FROM TransactionHDR TH 
       WHERE TH.MenuId = 1`
    );

    const chkMap = {
      1: 'CompanyName',
      2: 'Address',
      3: 'DealerName',
      4: 'ContactInfo',
      5: 'MailId',
      6: 'Remarks'
    };

    const result = [];

    for (const row of rows) {
      const activityId = row.ActivityId;

      const [latRows] = await db.query(
        `SELECT LatLong FROM TransactionDTL 
         WHERE ActivityId = ? AND LatLong IS NOT NULL AND LatLong != '' 
         LIMIT 1`,
        [activityId]
      );
      const latLong = latRows && latRows.length > 0 ? latRows[0].LatLong : '';

      const [dtlRows] = await db.query(
        `SELECT ChkId, Value FROM TransactionDTL 
         WHERE ActivityId = ? AND ChkId IN (1, 2, 3, 4, 5, 6)`,
        [activityId]
      );

      const dealer = {
        DealerID: row.DealerID,
        LatLong: latLong
      };

      for (const dtl of dtlRows) {
        const key = chkMap[dtl.ChkId];
        if (key) {
          dealer[key] = dtl.Value;
        }
      }

      for (const fieldName of Object.values(chkMap)) {
        if (dealer[fieldName] === undefined) {
          dealer[fieldName] = '';
        }
      }

      result.push(dealer);
    }

    response.success = true;
    response.message = 'Dealers fetched successfully.';
    response.data = result;
    return res.json(response);
  } catch (err) {
    console.error('Error in getDealers:', err);
    response.message = `An error occurred: ${err.message}`;
    return res.status(500).json(response);
  }
};

module.exports = getDealers;
