const { pool } = require('../../config/db');

const disablePolicy = async (req, res, next) => {
  try {
    const data = req.body || {};
    const policyId = data.PolicyId || '';
    const action = String(data.action || 'disable').toLowerCase();

    if (!policyId) {
      return res.json({ success: false, message: 'Policy ID is required.' });
    }

    const isActive = action === 'enable' ? 1 : 0;

    const [result] = await pool.query(
      'UPDATE OrganizationPolicy SET IsActive = ? WHERE Id = ?',
      [isActive, policyId]
    );

    if (result.affectedRows > 0) {
      return res.json({
        success: true,
        message: isActive === 1 ? 'Policy enabled successfully.' : 'Policy disabled successfully.'
      });
    } else {
      return res.json({ success: false, message: 'Failed to update policy status.' });
    }
  } catch (err) {
    return res.json({ success: false, message: 'Error: ' + err.message });
  }
};

// POST /src/policy/upload_policy.php;

module.exports = disablePolicy;
