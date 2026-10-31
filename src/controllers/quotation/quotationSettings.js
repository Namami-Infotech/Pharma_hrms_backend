const db = require('../../config/db');

/**
 * GET /quotation/settings
 * Returns dynamic configuration for Quotations (discount approval threshold %)
 */
const getQuotationSettings = async (req, res) => {
  const response = { success: false, message: '', data: null };

  try {
    const [rows] = await db.query(
      "SELECT setting_key, setting_value, description FROM settings WHERE setting_key = 'quotation_approval_threshold' LIMIT 1"
    );

    let threshold = 35; // Default 35% discount threshold
    if (rows && rows.length > 0) {
      threshold = parseFloat(rows[0].setting_value) || 35;
    }

    response.success = true;
    response.data = {
      quotation_approval_threshold: threshold,
      unit: '%'
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
 * Update dynamic approval threshold percentage
 */
const updateQuotationSettings = async (req, res) => {
  const response = { success: false, message: '', data: null };
  const { quotation_approval_threshold } = req.body || {};

  const numVal = parseFloat(quotation_approval_threshold);
  if (isNaN(numVal) || numVal < 0 || numVal > 100) {
    response.message = 'Please provide a valid discount threshold percentage (between 0% and 100%).';
    return res.status(400).json(response);
  }

  try {
    await db.query(
      `INSERT INTO settings (setting_key, setting_value, description)
       VALUES ('quotation_approval_threshold', ?, 'Discount percentage threshold above which RM approval is required (default 35%)')
       ON DUPLICATE KEY UPDATE setting_value = ?`,
      [numVal.toString(), numVal.toString()]
    );

    response.success = true;
    response.message = `Approval discount threshold updated to ${numVal}%.`;
    response.data = { quotation_approval_threshold: numVal, unit: '%' };
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
