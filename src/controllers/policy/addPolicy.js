const { pool } = require('../../config/db');

const addPolicy = async (req, res, next) => {
  try {
    const data = req.body || {};
    const policyName = data.subject || '';
    const policyDescription = data.body || '';
    const pdfBase64 = data.pdf || '';
    const tenentId = data.Tenent_Id || null;

    if (!policyName || !pdfBase64 || !tenentId) {
      return res.json({
        success: false,
        message: 'Policy name, PDF data, and Tenent_Id are required.'
      });
    }

    await pool.query(
      `INSERT INTO OrganizationPolicy (PolicyName, PolicyDescription, PolicyPDF, Tenent_Id) 
       VALUES (?, ?, ?, ?)`,
      [policyName, policyDescription, pdfBase64, tenentId]
    );

    return res.json({ success: true, message: 'Policy added successfully.' });
  } catch (err) {
    return res.json({ success: false, message: 'Error: ' + err.message });
  }
};

// POST /src/policy/disable_policy.php;

module.exports = addPolicy;
