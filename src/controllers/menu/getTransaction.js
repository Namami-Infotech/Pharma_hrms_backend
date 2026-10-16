const { pool } = require('../../config/db');

const getTransaction = async (req, res, next) => {
  try {
    const menuId = req.query.menuId || req.body?.menuId;
    if (!menuId) {
      return res.json({ success: false, message: 'MenuId is required.', data: [] });
    }

    const query = `
      SELECT hdr.MenuId, hdr.ActivityId, dtl.ChkId, dtl.Value, dtl.LatLong, dtl.DateTime 
      FROM TransactionHDR hdr 
      JOIN TransactionDTL dtl ON hdr.ActivityId = dtl.ActivityId 
      WHERE hdr.MenuId = ?
    `;

    const [transactions] = await pool.query(query, [menuId]);

    if (transactions.length > 0) {
      const groupedData = {};

      for (const transaction of transactions) {
        const activityId = transaction.ActivityId;

        if (!groupedData[activityId]) {
          groupedData[activityId] = {
            MenuId: transaction.MenuId,
            ActivityId: activityId,
            LatLong: transaction.LatLong,
            DateTime: transaction.DateTime,
            Details: []
          };
        }

        groupedData[activityId].Details.push({
          ChkId: transaction.ChkId,
          Value: transaction.Value
        });
      }

      return res.json({
        success: true,
        message: 'Transactions retrieved successfully.',
        data: Object.values(groupedData)
      });
    } else {
      return res.json({
        success: false,
        message: 'No transactions found for the given MenuId.',
        data: []
      });
    }
  } catch (err) {
    return res.json({ success: false, message: 'Error: ' + err.message, data: [] });
  }
};

// GET /src/menu/get_types.php;

module.exports = getTransaction;
