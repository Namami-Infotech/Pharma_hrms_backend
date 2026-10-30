const { pool } = require('../../config/db');

const uploadPolicy = (req, res, next) => {
  if (!req.file) {
    return res.json({ success: false, error: 'No file uploaded or invalid request.' });
  }

  const baseUrl = (process.env.BACKEND_URL || process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`).replace(/\/+$/, '');

  return res.json({
    success: true,
    fileUrl: `${baseUrl}/uploads/policies/${req.file.filename}`
  });
};

// GET /src/policy/view_policy.php;

module.exports = uploadPolicy;
