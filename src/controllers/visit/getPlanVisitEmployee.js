const db = require('../../config/db');

const getPlanVisitEmployee = async (req, res) => {
  const response = { success: false, message: '', data: [] };
  const empId = req.query.empId || req.body?.empId || req.query.EmpId || req.body?.EmpId || null;

  try {
    let query = `
      SELECT 
        pv.EmpId, 
        pv.DealerID, 
        d.DealerName, 
        d.LatLong, 
        pv.Plan_Visit, 
        pv.VisitID,
        pv.Remarks,
        pv.VisitTime,
        pv.VisitCount,
        pv.CompanyName,
        pv.MobileNo,
        pv.Mode,
        pv.Purpose,
        pv.Status
      FROM Visit pv
      LEFT JOIN Dealers d ON pv.DealerID = d.DealerID
      WHERE pv.Plan_Visit IS NOT NULL
        AND NOT EXISTS (
            SELECT 1 
            FROM Visit v2 
            WHERE v2.old_visit = pv.VisitID
        )
    `;

    const params = [];
    if (empId && String(empId).trim() !== '') {
      query += ` AND pv.EmpId = ?`;
      params.push(String(empId).trim());
    }

    query += ` ORDER BY pv.Plan_Visit DESC`;

    const [rows] = await db.query(query, params);

    response.success = true;
    response.data = rows || [];
    response.message = rows && rows.length > 0
      ? `${rows.length} plan visit records found.`
      : 'No plan visit records found.';

    return res.json(response);
  } catch (err) {
    console.error('Error in getPlanVisitEmployee:', err);
    response.message = `Database error: ${err.message}`;
    return res.status(500).json(response);
  }
};

module.exports = getPlanVisitEmployee;
