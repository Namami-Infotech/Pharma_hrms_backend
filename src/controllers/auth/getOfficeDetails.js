const { getOfficeDetails: getDetails } = require('./authHelper');

// Endpoint handler for /auth/get_office_details.php
const getOfficeDetails = async (req, res) => {
  const empId = req.query.emp_id || req.body.emp_id || req.query.EmpId || req.body.EmpId;
  if (!empId) {
    return res.json({ success: false, message: 'emp_id is required' });
  }
  const result = await getDetails(empId);
  return res.json(result);
};

module.exports = getOfficeDetails;
