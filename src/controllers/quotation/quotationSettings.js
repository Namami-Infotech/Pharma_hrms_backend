const db = require('../../config/db');

/**
 * GET /quotation/settings
 * Returns dynamic configuration for Quotations (e.g., approval threshold)
 */
const getQuotationSettings = async (req, res) => {
  const response = { success: false, message: '', data: null };

  try {
    const [rows] = await db.query(
      "SELECT setting_key, setting_value, description FROM settings WHERE setting_key = 'quotation_approval_threshold' LIMIT 1"
    );

    let threshold = 35000;
    if (rows && rows.length > 0) {
      threshold = parseFloat(rows[0].setting_value) || 35000;
    }

    response.success = true;
    response.data = {
      quotation_approval_threshold: threshold
    };
    return res.json(response);
  } catch (err) {
    console.error('Error fetching quotation settings:', err);
    response.message = err.message;
    return res.status(500).json(response);
  }
};

/**
 * POST /quotation/settings
 * Update dynamic approval threshold
 */
const updateQuotationSettings = async (req, res) => {
  const response = { success: false, message: '', data: null };
  const { quotation_approval_threshold } = req.body || {};

  const numVal = parseFloat(quotation_approval_threshold);
  if (isNaN(numVal) || numVal < 0) {
    response.message = 'Please provide a valid threshold amount (>= 0).';
    return res.status(400).json(response);
  }

  try {
    await db.query(
      `INSERT INTO settings (setting_key, setting_value, description)
       VALUES ('quotation_approval_threshold', ?, 'Quotation amount threshold above which approval is required before sending email')
       ON DUPLICATE KEY UPDATE setting_value = ?`,
      [numVal.toString(), numVal.toString()]
    );

    response.success = true;
    response.message = `Approval threshold updated to ₹${numVal.toLocaleString('en-IN')}.`;
    response.data = { quotation_approval_threshold: numVal };
    return res.json(response);
  } catch (err) {
    console.error('Error updating quotation settings:', err);
    response.message = err.message;
    return res.status(500).json(response);
  }
};

module.exports = {
  getQuotationSettings,
  updateQuotationSettings
};
