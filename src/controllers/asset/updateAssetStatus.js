const db = require('../../config/db');

// 5. Update Asset Status (src/assets/update_asset_status.php)
const updateAssetStatus = async (req, res) => {
  const response = { success: false, message: '' };
  const data = req.body || {};

  const issueId = data.issue_id || '';
  const status = data.status || '';

  if (!issueId || !status) {
    response.message = 'Issue ID and status are required.';
    return res.json(response);
  }

  try {
    const [result] = await db.execute(
      'UPDATE assets_issue SET status = ? WHERE id = ?',
      [status, issueId]
    );

    if (result.affectedRows > 0) {
      response.success = true;
      response.message = 'Status updated successfully.';
    } else {
      response.message = 'Asset issuance not found.';
    }

    return res.json(response);
  } catch (err) {
    console.error('Error in updateAssetStatus:', err);
    response.message = `Error updating status: ${err.message}`;
    return res.status(500).json(response);
  }
};

module.exports = updateAssetStatus;
