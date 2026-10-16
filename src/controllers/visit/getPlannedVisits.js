const db = require('../../config/db');
const { getDrivingDistance } = require('./visitHelper');

const getPlannedVisits = async (req, res) => {
  const response = { success: false, message: '', data: [] };
  const empId = req.query.empId || null;
  const role = req.query.role || null;
  const date = req.query.date || null;

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
        v.Status
      FROM Visit v
      WHERE v.Plan_Visit IS NOT NULL
    `;

    const conditions = [];
    const params = [];

    if (date) {
      conditions.push('DATE(v.Plan_Visit) = ?');
      params.push(date);
    }

    if (role === 'HR') {
      if (empId) {
        conditions.push('v.EmpId = ?');
        params.push(empId);
      }
    } else {
      if (empId) {
        conditions.push('v.EmpId = ?');
        params.push(empId);
      } else {
        response.message = 'Employee ID is required for non-HR users.';
        return res.json(response);
      }
    }

    conditions.push('v.old_visit IS NULL');

    if (conditions.length > 0) {
      query += ' AND ' + conditions.join(' AND ');
    }

    query += ' ORDER BY v.Plan_Visit DESC, v.VisitID DESC';

    const [planVisitData] = await db.query(query, params);

    if (planVisitData && planVisitData.length > 0) {
      response.success = true;
      response.data = planVisitData;
      response.message = `${planVisitData.length} planned visit(s) found.`;
    } else {
      response.message = 'No planned visits found for the specified criteria.';
      response.data = [];
    }

    return res.json(response);
  } catch (err) {
    console.error('Error in getPlannedVisits:', err);
    response.message = `Database error: ${err.message}`;
    return res.status(500).json(response);
  }
};

// 4. Plan Visit Employee (src/visit/plan_visit.php);

module.exports = getPlannedVisits;
