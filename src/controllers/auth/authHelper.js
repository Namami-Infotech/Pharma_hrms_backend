const bcrypt = require('bcryptjs');
const db = require('../../config/db');

// Helper to verify passwords against standard bcrypt or PHP's $2y$ hashes
function verifyPassword(plainPassword, hashedPassword) {
  if (!plainPassword || !hashedPassword) return false;
  // Normalize PHP $2y$ prefix to $2a$ for bcryptjs compatibility
  const normalizedHash = hashedPassword.replace(/^\$2y\$/, '$2a$');
  try {
    return bcrypt.compareSync(plainPassword, normalizedHash);
  } catch (err) {
    return false;
  }
}

// Helper to hash passwords using bcrypt
function hashPassword(password) {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}

// Helper: get office details (office_details_function.php)
async function getOfficeDetails(empId, connection = db.pool) {
  const response = { success: false, message: '', data: [] };

  try {
    const [empRows] = await connection.query(
      'SELECT OfficeId FROM Employees WHERE EmpId = ? LIMIT 1',
      [empId]
    );

    if (!empRows || empRows.length === 0) {
      response.message = 'Employee not found.';
      return response;
    }

    const officeIdsStr = empRows[0].OfficeId;
    if (!officeIdsStr) {
      response.message = 'No Office IDs found for the employee.';
      return response;
    }

    const officeIdsArray = officeIdsStr
      .split(',')
      .map(id => id.trim())
      .filter(id => id.length > 0);

    if (officeIdsArray.length === 0) {
      response.message = 'No Office IDs found for the employee.';
      return response;
    }

    const placeholders = officeIdsArray.map(() => '?').join(',');
    const [officeRows] = await connection.query(
      `SELECT Id, LatLong, Distance, IsActive, OfficeName 
       FROM EmployeeOffice 
       WHERE Id IN (${placeholders}) AND IsActive = 1 
       ORDER BY Id DESC`,
      officeIdsArray
    );

    if (officeRows && officeRows.length > 0) {
      response.success = true;
      response.message = 'Office details retrieved successfully.';
      response.data = officeRows.map(row => ({
        id: row.Id,
        lat_long: row.LatLong,
        distance: row.Distance,
        status: row.IsActive,
        OfficeName: row.OfficeName
      }));
    } else {
      response.message = 'No office details found.';
    }

    return response;
  } catch (err) {
    console.error('Error in getOfficeDetails:', err);
    response.message = `Database error: ${err.message}`;
    return response;
  }
}

// Helper: get tenant module menu IDs
async function getMenuByTenent(tenentId) {
  if (!tenentId) return [];
  try {
    let rows;
    try {
      [rows] = await db.query(
        'SELECT Menu FROM Tenent WHERE Tenent_ID = ? LIMIT 1',
        [tenentId]
      );
    } catch (e1) {
      [rows] = await db.query(
        'SELECT Menu FROM tenent WHERE Tenent_ID = ? LIMIT 1',
        [tenentId]
      );
    }

    if (rows && rows.length > 0 && rows[0].Menu) {
      return rows[0].Menu.split(',')
        .map(x => parseInt(x.trim(), 10))
        .filter(n => !isNaN(n));
    }
  } catch (err) {
    console.error('Error fetching tenant menu:', err);
  }
  return [];
}

const ROLE_MODULES = {
  Admin: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
  SuperAdmin: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
  HR: [1, 2, 3, 4, 7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 18, 19, 20, 21, 22],
  Manager: [1, 2, 3, 5, 6, 8, 9, 14, 17, 18, 19, 21, 22, 23],
  Sales: [1, 2, 3, 4, 5, 6, 8, 9, 14, 18, 19, 21, 22, 23],
  Employee: [1, 2, 3, 6, 8, 9, 10, 14, 21, 22],
  default: [1, 2, 8, 9, 21, 22]
};

// Filter tenant menu by employee role
function filterModulesByRole(role, tenantMenu = []) {
  if (!role) return tenantMenu;
  const normalizedKey = Object.keys(ROLE_MODULES).find(
    k => k.toLowerCase() === role.toString().trim().toLowerCase()
  );
  if (!normalizedKey || normalizedKey.toLowerCase() === 'admin' || normalizedKey.toLowerCase() === 'superadmin') {
    return tenantMenu;
  }
  const allowed = ROLE_MODULES[normalizedKey] || ROLE_MODULES.default;
  return tenantMenu.filter(id => allowed.includes(id));
}

module.exports = {
  verifyPassword,
  hashPassword,
  getOfficeDetails,
  getMenuByTenent,
  filterModulesByRole,
  ROLE_MODULES
};
