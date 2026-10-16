const db = require('../../config/db');

const addOffice = async (req, res) => {
  const response = { success: false, message: '' };
  const data = req.body || {};

  if (!data.EmpId || !data.OfficeName || !data.LatLong || data.Distance === undefined) {
    response.message = 'Missing required fields: EmpId, OfficeName, LatLong, Distance';
    return res.json(response);
  }

  const isActive = data.IsActive !== undefined ? parseInt(data.IsActive, 10) : 1;

  try {
    const sql = `
      INSERT INTO EmployeeOffice (EmpId, OfficeName, LatLong, Distance, IsActive)
      VALUES (?, ?, ?, ?, ?)
    `;
    await db.execute(sql, [data.EmpId, data.OfficeName, data.LatLong, data.Distance, isActive]);

    response.success = true;
    response.message = 'Office added successfully.';
    return res.json(response);
  } catch (err) {
    console.error('Error in addOffice:', err);
    response.message = `An error occurred: ${err.message}`;
    return res.status(500).json(response);
  }
};

// 7. Get Office (src/employee/get_office.php);

module.exports = addOffice;
