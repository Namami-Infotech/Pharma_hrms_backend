const db = require('../../config/db');
const { getDrivingDistance } = require('./visitHelper');

const getPlanVisitEmployee = async (req, res) => {
  const response = { success: false, message: '', data: [] };
  const empId = req.query.empId || null;

  if (empId === null) {
    response.message = '"empId" parameter is missing from the request.';
    return res.json(response);
  }

  try {
    const query = `
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
      INNER JOIN Dealers d ON pv.DealerID = d.DealerID
      WHERE pv.EmpId = ?
        AND NOT EXISTS (
            SELECT 1 
            FROM Visit v2 
            WHERE v2.old_visit = pv.VisitID
        )
      ORDER BY pv.Plan_Visit DESC
    `;

    const [rows] = await db.query(query, [empId]);

    if (rows && rows.length > 0) {
      response.success = true;
      response.data = rows;
    } else {
      response.message = 'No plan visit records found for this employee.';
    }

    return res.json(response);
  } catch (err) {
    console.error('Error in getPlanVisitEmployee:', err);
    response.message = `Database error: ${err.message}`;
    return res.status(500).json(response);
  }
};

// 5. View One Visit (src/visit/view_one_visit.php);

module.exports = getPlanVisitEmployee;
