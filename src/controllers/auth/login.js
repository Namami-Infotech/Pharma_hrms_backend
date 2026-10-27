const db = require('../../config/db');
const { verifyPassword, getOfficeDetails, getMenuByTenent, filterModulesByRole } = require('./authHelper');

// 1. Login (src/auth/login.php)
const login = async (req, res) => {
  const response = { success: false, message: '' };

  const data = req.body || {};
  const identifier = (data.EmpId || data.empId || data.username || data.EmailId || '').toString().trim();
  const password = (data.password || data.Password || '').toString();
  const mobileId = data.mobileId || data.MobileId || '';
  const fcmToken = data.fcm_token || data.fcmToken || '';

  if (!identifier || !password) {
    response.message = 'Please fill in all fields.';
    return res.json(response);
  }

  try {
    const [rows] = await db.query(
      'SELECT * FROM Employees WHERE EmpId = ? OR Mobile = ? OR EmailId = ? LIMIT 1',
      [identifier, identifier, identifier]
    );

    if (!rows || rows.length === 0) {
      response.message = 'No user found with this identifier (Employee ID, Mobile, or Email).';
      return res.json(response);
    }

    const employee = rows[0];

    if (parseInt(employee.IsActive, 10) === 0) {
      response.message = 'Your account is inactive. Please contact your administrator.';
      return res.json(response);
    }

    if (!verifyPassword(password, employee.Password)) {
      response.message = 'Invalid credentials. Please try again.';
      return res.json(response);
    }

    // Update MobileId and fcm_token if provided
    if (mobileId || fcmToken) {
      const updates = [];
      const params = [];
      if (mobileId) {
        updates.push('MobileId = ?');
        params.push(mobileId);
      }
      if (fcmToken) {
        updates.push('fcm_token = ?');
        params.push(fcmToken);
      }
      if (updates.length > 0) {
        params.push(employee.EmpId);
        await db.execute(
          `UPDATE Employees SET ${updates.join(', ')} WHERE EmpId = ?`,
          params
        );
      }
    }

    // Office details
    const officeDetails = await getOfficeDetails(employee.EmpId);

    // Tenant menu fetched dynamically from tenent table (Menu column)
    const tenantMenu = await getMenuByTenent(employee.Tenent_Id);

    // Resolve effective role (fallback to Designation if Role is blank)
    const effectiveRole = (employee.Role && employee.Role.trim()) ||
      (employee.Designation && ['Admin', 'HR', 'Manager', 'Sales', 'Employee'].includes(employee.Designation.trim())
        ? employee.Designation.trim()
        : 'Employee');

    // Filter tenant modules dynamically according to role
    const roleModules = filterModulesByRole(effectiveRole, tenantMenu);

    response.success = true;
    response.message = 'Login successful';
    response.data = {
      emp_id: employee.EmpId,
      image: employee.Pic,
      username: employee.Name,
      email: employee.EmailId,
      role: effectiveRole,
      rm: employee.RM,
      designation: employee.Designation,
      tenent_id: employee.Tenent_Id,
      shift: employee.Shift,
      regularise: '30',
      ResetTime: employee.ResetTime || '6:00',
      office_details: officeDetails.data,
      modules: roleModules,
      attendanceStatus: '1',
      faceAttendance: '0'
    };

    return res.json(response);
  } catch (err) {
    console.error('Login error:', err);
    response.message = 'An error occurred during login.';
    return res.status(500).json(response);
  }
};

module.exports = login;
