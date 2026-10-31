const db = require('./db');

async function initModuleTables() {
  console.log('[Migration] Creating modules and role_permissions tables...');

  // 1. Create modules table
  await db.query(`
    CREATE TABLE IF NOT EXISTS modules (
      id INT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      path VARCHAR(100) NOT NULL,
      icon VARCHAR(50) NOT NULL,
      category VARCHAR(50) NOT NULL,
      display_order INT DEFAULT 0,
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  // 2. Create role_permissions table
  await db.query(`
    CREATE TABLE IF NOT EXISTS role_permissions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      role_name VARCHAR(50) NOT NULL,
      module_ids TEXT NOT NULL,
      tenent_id INT DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_role_tenent (role_name, tenent_id)
    )
  `);

  // 3. Modules definition (8 inactive as requested: 6, 7, 8, 10, 11, 15, 20, 23)
  const allModules = [
    { id: 1, name: 'Attendance', path: '/attendance', icon: 'BarChart', category: 'Analytics', order: 1, active: 1 },
    { id: 2, name: 'Leave', path: '/leave', icon: 'Person', category: 'HR', order: 2, active: 1 },
    { id: 3, name: 'Expense', path: '/expense', icon: 'AccountBalanceWallet', category: 'Finance', order: 3, active: 1 },
    { id: 4, name: 'Leads', path: '/registration', icon: 'HowToReg', category: 'Sales', order: 4, active: 1 },
    { id: 5, name: 'Visit', path: '/visit', icon: 'AddLocationAlt', category: 'Field', order: 5, active: 1 },
    { id: 6, name: 'Travel', path: '/travel', icon: 'LocalAirport', category: 'Travel', order: 6, active: 0 }, // Inactive per user request
    { id: 7, name: 'Invoices', path: '/invoices', icon: 'Receipt', category: 'Finance', order: 7, active: 0 }, // Inactive per user request
    { id: 8, name: 'Policy', path: '/policy', icon: 'Policy', category: 'Compliance', order: 8, active: 0 }, // Inactive per user request
    { id: 9, name: 'Holiday', path: '/holiday', icon: 'HolidayVillage', category: 'HR', order: 9, active: 1 },
    { id: 10, name: 'Tickets', path: '/tickets', icon: 'SupportAgent', category: 'Support', order: 10, active: 0 }, // Inactive per user request
    { id: 11, name: 'Assets', path: '/assets', icon: 'Laptop', category: 'IT', order: 11, active: 0 }, // Inactive per user request
    { id: 12, name: 'Employees', path: '/employees', icon: 'Person', category: 'HR', order: 12, active: 1 },
    { id: 13, name: 'Offices', path: '/offices', icon: 'Business', category: 'HR', order: 13, active: 1 },
    { id: 14, name: 'Salary', path: '/salary', icon: 'Payments', category: 'Finance', order: 14, active: 1 },
    { id: 15, name: 'Docket', path: '/docket', icon: 'HowToReg', category: 'Operations', order: 15, active: 0 }, // Inactive per user request
    { id: 16, name: 'Manual Attendance', path: '/manual-attendance', icon: 'EditCalendar', category: 'Analytics', order: 16, active: 1 },
    { id: 17, name: 'Regularise', path: '/regularise', icon: 'HowToReg', category: 'HR', order: 17, active: 1 },
    { id: 18, name: 'Quotation', path: '/quotation', icon: 'RequestQuote', category: 'Finance', order: 18, active: 1 },
    { id: 19, name: 'Products', path: '/products', icon: 'Medication', category: 'Finance', order: 19, active: 1 },
    { id: 20, name: 'Reports', path: '/report', icon: 'Summarize', category: 'Analytics', order: 20, active: 0 }, // Inactive per user request
    { id: 21, name: 'Dashboard', path: '/dashboard', icon: 'Dashboard', category: 'Main', order: 21, active: 1 },
    { id: 22, name: 'Notifications', path: '/notification', icon: 'Notifications', category: 'Main', order: 22, active: 1 },
    { id: 23, name: 'Maps', path: '/maps', icon: 'Map', category: 'Field', order: 23, active: 0 }, // Inactive per user request
    { id: 24, name: 'Advance', path: '/advance', icon: 'AccountBalanceWallet', category: 'Finance', order: 24, active: 1 }
  ];

  for (const m of allModules) {
    await db.query(`
      INSERT INTO modules (id, name, path, icon, category, display_order, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        path = VALUES(path),
        icon = VALUES(icon),
        category = VALUES(category),
        display_order = VALUES(display_order),
        is_active = VALUES(is_active)
    `, [m.id, m.name, m.path, m.icon, m.category, m.order, m.active]);
  }
  console.log(`[Migration] Seeded ${allModules.length} modules into database.`);

  // 4. Seed role_permissions (Only 4 roles: Admin, SuperAdmin, Sales, Employee)
  const defaultRoles = [
    {
      role: 'Admin',
      modules: '1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24'
    },
    {
      role: 'SuperAdmin',
      modules: '1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24'
    },
    {
      role: 'Sales',
      modules: '1,2,3,4,5,6,8,9,14,18,19,21,22,23'
    },
    {
      role: 'Employee',
      modules: '1,2,3,6,8,9,10,14,21,22,24'
    }
  ];

  // Remove any legacy roles that are no longer supported (safely handled if user lacks DELETE privilege)
  try {
    await db.query(`
      DELETE FROM role_permissions 
      WHERE role_name NOT IN ('Admin', 'SuperAdmin', 'Super Admin', 'Sales', 'Employee')
    `);
  } catch (delErr) {
    console.warn('[Migration] Notice: Skipped deleting legacy roles (no DELETE privilege):', delErr.message);
  }

  for (const r of defaultRoles) {
    await db.query(`
      INSERT INTO role_permissions (role_name, module_ids, tenent_id)
      VALUES (?, ?, 1)
      ON DUPLICATE KEY UPDATE
        module_ids = VALUES(module_ids)
    `, [r.role, r.modules]);
  }
  console.log('[Migration] Seeded role_permissions for 4 roles: Admin, SuperAdmin, Sales, Employee.');
}

module.exports = { initModuleTables };

if (require.main === module) {
  initModuleTables()
    .then(() => {
      console.log('[Migration] Done successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Migration] Failed:', err);
      process.exit(1);
    });
}
