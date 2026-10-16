const db = require('../../config/db');

const uploadEmployeeImage = async (req, res) => {
  const response = { success: false, message: '', data: null };

  const EmpId = req.body.EmpId;
  if (!EmpId) {
    response.message = 'Employee ID is required.';
    return res.json(response);
  }

  if (!req.file) {
    response.message = 'No file was uploaded.';
    return res.json(response);
  }

  const fileName = req.file.filename;
  const fileUrl = `https://namami-infotech.com/SAFEGUARD/src/employee/uploads/${fileName}`;

  try {
    const [result] = await db.execute(
      'UPDATE Employees SET Pic = ? WHERE EmpId = ?',
      [fileUrl, EmpId]
    );

    if (result.affectedRows > 0) {
      response.success = true;
      response.message = 'File uploaded and saved successfully.';
      response.data = { EmpId, FileUrl: fileUrl };
    } else {
      response.message = 'Failed to update the employee record.';
    }

    return res.json(response);
  } catch (err) {
    console.error('Error in uploadEmployeeImage:', err);
    response.message = `Error: ${err.message}`;
    return res.status(500).json(response);
  }
};

module.exports = uploadEmployeeImage;
