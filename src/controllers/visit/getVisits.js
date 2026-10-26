const db = require('../../config/db');

const getVisits = async (req, res) => {
  const response = { success: false, message: '', data: [] };
  const queryParams = req.query || {};
  const bodyParams = req.body || {};

  const visitId = queryParams.visitId || queryParams.visit_id || queryParams.id || bodyParams.visitId || null;
  const role = queryParams.role || bodyParams.role || null;
  const empId = queryParams.empId || queryParams.EmpId || bodyParams.empId || bodyParams.EmpId || null;
  const date = queryParams.date || bodyParams.date || null;
  const status = queryParams.status || bodyParams.status || null;
  const isPlanOnly = queryParams.type === 'plan' || req.path.includes('plan');

  try {
    let query = `
      SELECT 
        v.VisitID,
        v.EmpId,
        v.DealerID,
        v.DealerName,
        v.VisitCount,
        v.VisitLatLong,
        v.VisitTime,
        v.Status,
        v.Plan_Visit,
        v.CompanyName,
        v.MobileNo,
        v.Mode,
        v.Purpose,
        v.Remarks,
        v.Attachment,
        d.Address as DealerAddress,
        d.ContactInfo as DealerContact,
        d.LatLong as DealerLatLong
      FROM Visit v
      LEFT JOIN Dealers d ON v.DealerID = d.DealerID
    `;

    const conditions = [];
    const params = [];

    // 1. Single visit lookup
    if (visitId) {
      conditions.push('v.VisitID = ?');
      params.push(visitId);
    } else {
      // 2. Planned visits filter
      if (isPlanOnly) {
        conditions.push('v.Plan_Visit IS NOT NULL');
        conditions.push('v.old_visit IS NULL');
      }

      // 3. Status filter
      if (status) {
        conditions.push('v.Status = ?');
        params.push(status);
      }

      // 4. Employee filter
      if (empId && String(empId).trim() !== '') {
        conditions.push('v.EmpId = ?');
        params.push(String(empId).trim());
      }

      // 5. Date filter
      if (date && String(date).trim() !== '') {
        conditions.push('(DATE(v.VisitTime) = ? OR DATE(v.Plan_Visit) = ? OR DATE(v.create_time) = ?)');
        params.push(String(date).trim(), String(date).trim(), String(date).trim());
      }
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY v.VisitTime DESC, v.Plan_Visit DESC, v.VisitID DESC';

    const [rows] = await db.query(query, params);

    for (const item of (rows || [])) {
      if (item.Attachment && Buffer.isBuffer(item.Attachment)) {
        item.Attachment = item.Attachment.toString('base64');
      }
    }

    response.success = true;
    response.data = rows || [];
    response.message = rows && rows.length > 0
      ? `${rows.length} visit record(s) retrieved successfully.`
      : 'No visit records found.';

    return res.json(response);
  } catch (err) {
    console.error('Error in getVisits:', err);
    response.message = `An error occurred: ${err.message}`;
    return res.status(500).json(response);
  }
};

module.exports = getVisits;
