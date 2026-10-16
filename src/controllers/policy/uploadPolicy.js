const { pool } = require('../../config/db');

const uploadPolicy = (req, res, next) => {
  if (!req.file) {
    return res.json({ success: false, error: 'No file uploaded or invalid request.' });
  }

  const uploadBaseUrl = process.env.BASE_URL 
    ? `${process.env.BASE_URL}/uploads/` 
    : 'https://namami-infotech.com/HR-SMILE-BACKEND/uploads/';

  return res.json({
    success: true,
    fileUrl: uploadBaseUrl + req.file.filename
  });
};

// GET /src/policy/view_policy.php;

module.exports = uploadPolicy;
