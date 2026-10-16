const db = require('../../config/db');
const { getDrivingDistance } = require('./visitHelper');

const viewVisit = async (req, res) => {
  const response = { success: false, message: '', data: [] };
  const role = req.query.role || null;
  const empId = req.query.empId || null;
  const date = req.query.date || new Date().toISOString().slice(0, 10);

  if (role === null && empId === null) {
    response.message = 'Both role and empId are missing from the request.';
    return res.json(response);
  }

  try {
    let query = `
      SELECT EmpId, DealerID, DealerName, VisitCount, VisitLatLong, VisitTime, CompanyName, MobileNo, VisitID
      FROM Visit
    `;

    const conditions = [];
    const params = [];

    if (role !== 'HR' && empId) {
      conditions.push('EmpId = ?');
      params.push(empId);
    }

    conditions.push('DATE(VisitTime) = ?');
    params.push(date);

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    const [visitData] = await db.query(query, params);

    if (visitData && visitData.length > 0) {
      for (const visit of visitData) {
        if (visit.Attachment) {
          if (Buffer.isBuffer(visit.Attachment)) {
            visit.Attachment = visit.Attachment.toString('base64');
          }
        }
      }

      response.success = true;
      response.data = visitData;
    } else {
      response.message = 'No visit records found for the specified date and employee.';
    }

    return res.json(response);
  } catch (err) {
    console.error('Error in viewVisit:', err);
    response.message = 'An error occurred while fetching the data. Please try again later.';
    return res.status(500).json(response);
  }
};

// 7. Visits Entry Daily Processor (src/visit/visits_entry.php);

module.exports = viewVisit;
