const db = require('../../config/db');
const { getDrivingDistance } = require('./visitHelper');

const viewOneVisit = async (req, res) => {
  const response = { success: false, message: '', data: [] };
  const visit_id = req.query.visit_id || null;

  if (!visit_id) {
    response.message = 'VisitID is required.';
    return res.json(response);
  }

  try {
    const [rows] = await db.query('SELECT * FROM Visit WHERE VisitID = ?', [visit_id]);

    if (rows && rows.length > 0) {
      response.success = true;
      response.data = rows;
    } else {
      response.message = 'No records found for the specified VisitID.';
    }

    return res.json(response);
  } catch (err) {
    console.error('Error in viewOneVisit:', err);
    response.message = `Error: ${err.message}`;
    return res.status(500).json(response);
  }
};

// 6. View Visit (src/visit/view_visit.php);

module.exports = viewOneVisit;
