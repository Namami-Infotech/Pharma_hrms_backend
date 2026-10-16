const db = require('../../config/db');

const listEmployees = async (req, res) => {
  const response = { success: false, message: '', data: [] };
  const tenantId = req.query.Tenent_Id || null;

  if (!tenantId) {
    response.message = 'Missing Tenent_Id parameter.';
    return res.json(response);
  }

  try {
    const query = `
      SELECT 
        e.*,
        eo.OfficeName
      FROM Employees e
      LEFT JOIN EmployeeOffice eo 
        ON e.OfficeId = eo.Id
      WHERE e.Tenent_Id = ?
      ORDER BY e.EmpId ASC
    `;

    const [employeeData] = await db.query(query, [tenantId]);

    if (employeeData && employeeData.length > 0) {
      for (const emp of employeeData) {
        emp.new_role = emp.Role;
        emp.Role = emp.Designation;
      }

      const lastEmployee = employeeData[employeeData.length - 1];
      const lastEmpId = lastEmployee ? lastEmployee.EmpId : null;

      response.success = true;
      response.data = employeeData;
      response.message = lastEmpId;
    } else {
      response.message = 'No employees found for the given Tenent_Id.';
    }

    return res.json(response);
  } catch (err) {
    console.error('Error in listEmployees:', err);
    response.message = `Database Error: ${err.message}`;
    return res.status(500).json(response);
  }
};

// 4. View Single Employee (src/employee/view_employee.php);

module.exports = listEmployees;
