const db = require('../../config/db');

/**
 * Get Advance Requests
 * GET /advance/get_advances.php or /advance
 */
const getAdvances = async (req, res) => {
  const response = { success: false, data: [], myRequests: [], teamRequests: [], message: '' };

  const empId = req.query.empId || req.query.emp_id || req.body?.empId || req.body?.emp_id || (req.user && (req.user.emp_id || req.user.EmpId)) || '';
  const role = req.query.role || req.body?.role || (req.user && (req.user.role || req.user.Role)) || '';
  const type = req.query.type || ''; // 'my' | 'team' | ''
  const isAdmin = ['Admin', 'admin', 'SuperAdmin'].includes(role);

  try {
    const baseSelect = `
      SELECT 
        ar.id,
        ar.EmpId,
        e.Name AS employee_name,
        e.Department AS department,
        e.Designation AS designation,
        e.RM AS rm_id_or_name,
        ar.amount,
        ar.deduction_month,
        ar.deduction_year,
        ar.reason,
        ar.status,
        ar.approved_by,
        app.Name AS approver_name,
        ar.approval_date,
        ar.remarks,
        ar.Tenent_Id,
        ar.created_at,
        ar.updated_at
      FROM advance_requests ar
      LEFT JOIN Employees e ON ar.EmpId COLLATE utf8mb4_unicode_ci = e.EmpId COLLATE utf8mb4_unicode_ci
      LEFT JOIN Employees app ON ar.approved_by COLLATE utf8mb4_unicode_ci = app.EmpId COLLATE utf8mb4_unicode_ci
    `;

    if (isAdmin) {
      // Admin can see everything or filter by type/empId if specified
      if (type === 'my' && empId) {
        const [rows] = await db.query(
          `${baseSelect} WHERE ar.EmpId = ? ORDER BY ar.created_at DESC`,
          [empId]
        );
        response.success = true;
        response.data = rows;
        response.myRequests = rows;
        return res.json(response);
      }

      const [rows] = await db.query(
        `${baseSelect} ORDER BY ar.created_at DESC`
      );

      response.success = true;
      response.data = rows;
      response.myRequests = empId ? rows.filter(r => String(r.EmpId) === String(empId)) : [];
      response.teamRequests = empId ? rows.filter(r => String(r.EmpId) !== String(empId)) : rows;
      return res.json(response);
    }

    if (!empId) {
      response.message = 'Employee ID is required to fetch advance requests.';
      return res.status(400).json(response);
    }

    // For Employee / RM:
    // 1. Fetch own requests
    const [myRows] = await db.query(
      `${baseSelect} WHERE ar.EmpId = ? ORDER BY ar.created_at DESC`,
      [empId]
    );

    // 2. Fetch team requests (where this user is the RM of the employee)
    // In pharma_hrms, Employees.RM can store either the RM's EmpId OR the RM's Name.
    const [teamRows] = await db.query(
      `${baseSelect} 
       WHERE ar.EmpId COLLATE utf8mb4_unicode_ci != ? 
         AND (e.RM COLLATE utf8mb4_unicode_ci = ? OR e.RM COLLATE utf8mb4_unicode_ci = (SELECT Name COLLATE utf8mb4_unicode_ci FROM Employees WHERE EmpId = ? LIMIT 1))
       ORDER BY ar.created_at DESC`,
      [empId, empId, empId]
    );

    response.success = true;
    response.myRequests = myRows;
    response.teamRequests = teamRows;

    if (type === 'my') {
      response.data = myRows;
    } else if (type === 'team') {
      response.data = teamRows;
    } else {
      // Default: combined data
      response.data = [...myRows, ...teamRows];
    }

    return res.json(response);
  } catch (err) {
    console.error('Error in getAdvances:', err);
    response.message = `Failed to fetch advance requests: ${err.message}`;
    return res.status(500).json(response);
  }
};

module.exports = getAdvances;
