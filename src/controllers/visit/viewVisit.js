const db = require('../../config/db');

const viewVisit = async (req, res) => {
  const response = { success: false, message: '', data: [] };
  const role = req.query.role || req.body?.role || null;
  const empId = req.query.empId || req.body?.empId || req.query.EmpId || req.body?.EmpId || null;
  const date = req.query.date || req.body?.date || null;

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
        d.ContactInfo as DealerContact
      FROM Visit v
      LEFT JOIN Dealers d ON v.DealerID = d.DealerID
    `;

    const conditions = [];
    const params = [];

    // Filter by empId if provided and not empty
    if (empId && String(empId).trim() !== '') {
      conditions.push('v.EmpId = ?');
      params.push(String(empId).trim());
    }

    // Filter by date if provided
    if (date && String(date).trim() !== '') {
      conditions.push('(DATE(v.VisitTime) = ? OR DATE(v.Plan_Visit) = ? OR DATE(v.create_time) = ?)');
      params.push(String(date).trim(), String(date).trim(), String(date).trim());
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY v.VisitTime DESC, v.VisitID DESC';

    const [visitData] = await db.query(query, params);

    if (visitData && visitData.length > 0) {
      for (const visit of visitData) {
        if (visit.Attachment && Buffer.isBuffer(visit.Attachment)) {
          visit.Attachment = visit.Attachment.toString('base64');
        }
      }
      response.success = true;
      response.data = visitData;
      response.message = 'Visits retrieved successfully.';
    } else {
      // 0 records is a valid successful result
      response.success = true;
      response.data = [];
      response.message = 'No visit records found for the specified criteria.';
    }

    return res.json(response);
  } catch (err) {
    console.error('Error in viewVisit:', err);
    response.message = `An error occurred while fetching visits: ${err.message}`;
    return res.status(500).json(response);
  }
};

module.exports = viewVisit;
