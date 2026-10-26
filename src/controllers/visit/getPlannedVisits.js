const db = require('../../config/db');

const getPlannedVisits = async (req, res) => {
  const response = { success: false, message: '', data: [] };
  const empId = req.query.empId || req.body?.empId || req.query.EmpId || req.body?.EmpId || null;
  const role = req.query.role || req.body?.role || null;
  const date = req.query.date || req.body?.date || null;

  try {
    let query = `
      SELECT
        v.VisitID,
        v.EmpId, 
        v.DealerID, 
        v.DealerName, 
        v.VisitLatLong, 
        v.Plan_Visit, 
        v.Remarks,
        v.CompanyName,
        v.MobileNo,
        v.Mode,
        v.Purpose,
        v.Status,
        v.VisitTime,
        v.Attachment,
        d.Address as DealerAddress,
        d.ContactInfo as DealerContact
      FROM Visit v
      LEFT JOIN Dealers d ON v.DealerID = d.DealerID
      WHERE v.Plan_Visit IS NOT NULL
    `;

    const conditions = [];
    const params = [];

    if (date && String(date).trim() !== '') {
      conditions.push('DATE(v.Plan_Visit) = ?');
      params.push(String(date).trim());
    }

    if (empId && String(empId).trim() !== '') {
      conditions.push('v.EmpId = ?');
      params.push(String(empId).trim());
    }

    conditions.push('v.old_visit IS NULL');

    if (conditions.length > 0) {
      query += ' AND ' + conditions.join(' AND ');
    }

    query += ' ORDER BY v.Plan_Visit DESC, v.VisitID DESC';

    const [planVisitData] = await db.query(query, params);

    for (const v of (planVisitData || [])) {
      if (v.Attachment && Buffer.isBuffer(v.Attachment)) {
        v.Attachment = v.Attachment.toString('base64');
      }
    }

    response.success = true;
    response.data = planVisitData || [];
    response.message = planVisitData && planVisitData.length > 0
      ? `${planVisitData.length} planned visit(s) found.`
      : 'No planned visits found for the specified criteria.';

    return res.json(response);
  } catch (err) {
    console.error('Error in getPlannedVisits:', err);
    response.message = `Database error: ${err.message}`;
    return res.status(500).json(response);
  }
};

module.exports = getPlannedVisits;
