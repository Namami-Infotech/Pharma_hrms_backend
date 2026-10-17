const db = require('../../config/db');

const getOffice = async (req, res) => {
  const response = { success: false, message: '', data: [] };

  try {
    const [rows] = await db.query('SELECT *, id AS Id, id AS OfficeId FROM EmployeeOffice');
    if (rows && rows.length > 0) {
      response.success = true;
      response.data = rows;
    } else {
      response.message = 'No records found.';
    }
    return res.json(response);
  } catch (err) {
    console.error('Error in getOffice:', err);
    response.message = `An error occurred: ${err.message}`;
    return res.status(500).json(response);
  }
};

// 8. Upload Employee Image (src/employee/upload_employee_image.php);

module.exports = getOffice;
