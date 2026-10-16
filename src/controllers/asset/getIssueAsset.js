const db = require('../../config/db');

// 4. Get Issued Assets (src/assets/get_issue_asset.php)
const getIssueAsset = async (req, res) => {
  const response = { success: false, message: '', data: [] };
  const role = req.query.role || null;
  const empId = req.query.EmpId || null;

  try {
    let sql = '';
    const params = [];

    if (role === 'HR') {
      sql = 'SELECT * FROM assets_issue';
    } else if (empId) {
      sql = 'SELECT * FROM assets_issue WHERE emp_id = ?';
      params.push(empId);
    } else {
      response.message = 'EmpId parameter is missing for non-HR role.';
      return res.json(response);
    }

    const [rows] = await db.query(sql, params);

    if (rows && rows.length > 0) {
      response.success = true;
      response.data = rows;
    } else {
      response.message = 'No issued assets found.';
    }

    return res.json(response);
  } catch (err) {
    console.error('Error in getIssueAsset:', err);
    response.message = `Error: ${err.message}`;
    return res.status(500).json(response);
  }
};

module.exports = getIssueAsset;
