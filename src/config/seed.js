const bcrypt = require('bcryptjs');
const db = require('./db');

/**
 * Seed data definition for SAFEGUARD HRMS
 */
const DEFAULT_TENANT = {
  Tenent_ID: 1,
  Tenent_Name: 'SAFEGUARD Main',
  Menu: '1,2,3,4,5,6,7,8,9,10',
  IsActive: 1
};

const DEFAULT_OFFICES = [
  {
    id: 1,
    OfficeName: 'Head Office - Haridwar',
    OfficeAddress: 'Industrial Area, SIDCUL, Haridwar, Uttarakhand 249403',
    LatLong: '29.954646,78.074990',
    Distance: 200,
    Tenent_Id: 1,
    IsActive: 1
  },
  {
    id: 2,
    OfficeName: 'Branch Office - Delhi NCR',
    OfficeAddress: 'Sector 62, Noida, Uttar Pradesh 201309',
    LatLong: '28.628000,77.364900',
    Distance: 200,
    Tenent_Id: 1,
    IsActive: 1
  },
  {
    id: 3,
    OfficeName: 'Regional Office - Mumbai',
    OfficeAddress: 'Andheri East, Mumbai, Maharashtra 400069',
    LatLong: '19.113600,72.869700',
    Distance: 200,
    Tenent_Id: 1,
    IsActive: 1
  }
];

const SEED_USERS = [
  {
    EmpId: 'ADMIN001',
    Name: 'Admin Administrator',
    EmailId: 'admin@safeguard.com',
    Mobile: '9876543210',
    PlainPassword: 'Admin@123',
    Role: 'Admin',
    Designation: 'System Administrator',
    Department: 'Management',
    OfficeId: '1,2,3',
    RM: null,
    Shift: 'General (9:00 AM - 6:00 PM)',
    ResetTime: '06:00:00',
    Tenent_Id: 1,
    IsActive: 1
  },
  {
    EmpId: 'HR001',
    Name: 'HR Manager',
    EmailId: 'hr@safeguard.com',
    Mobile: '9876543211',
    PlainPassword: 'Hr@123',
    Role: 'HR',
    Designation: 'HR Head',
    Department: 'Human Resources',
    OfficeId: '1,2',
    RM: 'ADMIN001',
    Shift: 'General (9:00 AM - 6:00 PM)',
    ResetTime: '06:00:00',
    Tenent_Id: 1,
    IsActive: 1
  },
  {
    EmpId: 'MGR001',
    Name: 'Regional Manager',
    EmailId: 'manager@safeguard.com',
    Mobile: '9876543212',
    PlainPassword: 'Manager@123',
    Role: 'Manager',
    Designation: 'Area Sales Manager',
    Department: 'Sales & Marketing',
    OfficeId: '1,2,3',
    RM: 'ADMIN001',
    Shift: 'General (9:00 AM - 6:00 PM)',
    ResetTime: '06:00:00',
    Tenent_Id: 1,
    IsActive: 1
  },
  {
    EmpId: 'EMP001',
    Name: 'Field Officer',
    EmailId: 'employee@safeguard.com',
    Mobile: '9876543213',
    PlainPassword: 'Employee@123',
    Role: 'Employee',
    Designation: 'Medical Representative',
    Department: 'Field Sales',
    OfficeId: '1',
    RM: 'MGR001',
    Shift: 'General (9:00 AM - 6:00 PM)',
    ResetTime: '06:00:00',
    Tenent_Id: 1,
    IsActive: 1
  },
  {
    EmpId: '123456',
    Name: 'Demo User',
    EmailId: 'demo@safeguard.com',
    Mobile: '9999999999',
    PlainPassword: 'Demo@123',
    Role: 'Employee',
    Designation: 'Sales Executive',
    Department: 'Sales',
    OfficeId: '1',
    RM: 'MGR001',
    Shift: 'General (9:00 AM - 6:00 PM)',
    ResetTime: '06:00:00',
    Tenent_Id: 1,
    IsActive: 1
  }
];

const DEFAULT_HOLIDAYS = [
  { date: '2026-01-26', title: 'Republic Day', Tenent_Id: 1 },
  { date: '2026-08-15', title: 'Independence Day', Tenent_Id: 1 },
  { date: '2026-10-02', title: 'Gandhi Jayanti', Tenent_Id: 1 },
  { date: '2026-11-08', title: 'Diwali', Tenent_Id: 1 },
  { date: '2026-12-25', title: 'Christmas Day', Tenent_Id: 1 }
];

/**
 * Main seeding function. Idempotent: checks for existence before inserting/updating.
 */
async function seedDatabase() {
  console.log('\n[Database Seeder] Checking and seeding default records...');

  try {
    // 1. Seed Tenant
    try {
      const [existingTenants] = await db.query(
        'SELECT Tenent_ID FROM tenent WHERE Tenent_ID = ? LIMIT 1',
        [DEFAULT_TENANT.Tenent_ID]
      );
      if (!existingTenants || existingTenants.length === 0) {
        await db.execute(
          'INSERT INTO tenent (Tenent_ID, Tenent_Name, Menu, IsActive) VALUES (?, ?, ?, ?)',
          [DEFAULT_TENANT.Tenent_ID, DEFAULT_TENANT.Tenent_Name, DEFAULT_TENANT.Menu, DEFAULT_TENANT.IsActive]
        );
        console.log(`[Database Seeder] ✓ Tenant '${DEFAULT_TENANT.Tenent_Name}' created.`);
      }
    } catch (err) {
      console.warn('[Database Seeder] Tenant table check/seed warning:', err.message);
    }

    // 2. Seed Offices
    try {
      for (const office of DEFAULT_OFFICES) {
        const [existing] = await db.query(
          'SELECT id FROM employeeoffice WHERE id = ? LIMIT 1',
          [office.id]
        );
        if (!existing || existing.length === 0) {
          await db.execute(
            'INSERT INTO employeeoffice (id, OfficeName, OfficeAddress, LatLong, Distance, Tenent_Id, IsActive) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [office.id, office.OfficeName, office.OfficeAddress, office.LatLong, office.Distance, office.Tenent_Id, office.IsActive]
          );
          console.log(`[Database Seeder] ✓ Office '${office.OfficeName}' created.`);
        }
      }
    } catch (err) {
      console.warn('[Database Seeder] Office table check/seed warning:', err.message);
    }

    // 3. Seed Users / Employees
    for (const user of SEED_USERS) {
      const hashedPassword = bcrypt.hashSync(user.PlainPassword, 10);
      try {
        const [existing] = await db.query(
          'SELECT EmpId FROM employees WHERE EmpId = ? LIMIT 1',
          [user.EmpId]
        );

        if (!existing || existing.length === 0) {
          // Insert new user
          await db.execute(
            `INSERT INTO employees 
             (EmpId, Name, EmailId, Mobile, Password, Role, Designation, Department, OfficeId, RM, Shift, ResetTime, Tenent_Id, IsActive) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              user.EmpId,
              user.Name,
              user.EmailId,
              user.Mobile,
              hashedPassword,
              user.Role,
              user.Designation,
              user.Department,
              user.OfficeId,
              user.RM,
              user.Shift,
              user.ResetTime,
              user.Tenent_Id,
              user.IsActive
            ]
          );
          console.log(`[Database Seeder] ✓ User '${user.Name}' (${user.EmpId} - ${user.Role}) created.`);
        } else {
          // Update credentials and essential fields so known passwords always work
          await db.execute(
            `UPDATE employees 
             SET Password = ?, IsActive = 1, Role = ?, Name = ?, EmailId = ?, Mobile = ?, OfficeId = ?, Shift = ?, ResetTime = ?
             WHERE EmpId = ?`,
            [
              hashedPassword,
              user.Role,
              user.Name,
              user.EmailId,
              user.Mobile,
              user.OfficeId,
              user.Shift,
              user.ResetTime,
              user.EmpId
            ]
          );
          console.log(`[Database Seeder] ✓ User '${user.Name}' (${user.EmpId}) verified & credentials updated.`);
        }

        // 4. Ensure EmployeeLeave record exists
        try {
          const [existingLeave] = await db.query(
            'SELECT id FROM employeeleave WHERE EmpId = ? LIMIT 1',
            [user.EmpId]
          );
          if (!existingLeave || existingLeave.length === 0) {
            await db.execute(
              `INSERT INTO employeeleave 
               (EmpId, LeaveType, TotalLeave, BalanceLeave, Tenent_Id, SL, EL, CL) 
               VALUES (?, 'Annual', 39, 39, ?, 12, 15, 12)`,
              [user.EmpId, user.Tenent_Id]
            );
          }
        } catch (leaveErr) {
          // Non-blocking if table or fields differ
        }

      } catch (err) {
        console.warn(`[Database Seeder] Error seeding user ${user.EmpId}:`, err.message);
      }
    }

    // 5. Seed sample holidays if empty
    try {
      const [holidayCount] = await db.query('SELECT COUNT(*) as cnt FROM holidays WHERE Tenent_Id = 1');
      if (holidayCount && holidayCount[0].cnt === 0) {
        for (const h of DEFAULT_HOLIDAYS) {
          await db.execute(
            'INSERT INTO holidays (date, title, Tenent_Id) VALUES (?, ?, ?)',
            [h.date, h.title, h.Tenent_Id]
          );
        }
        console.log('[Database Seeder] ✓ Sample holidays populated.');
      }
    } catch (err) {
      // Non-blocking
    }

    console.log('[Database Seeder] Database check & seeding completed successfully.\n');
    printCredentialsSummary();
    return true;
  } catch (err) {
    console.error('[Database Seeder] Seeding error:', err);
    return false;
  }
}

/**
 * Print clean summary table of credentials to console
 */
function printCredentialsSummary() {
  console.log('========================================================================');
  console.log('                SAFEGUARD HRMS - DEFAULT LOGIN CREDENTIALS             ');
  console.log('========================================================================');
  console.log(' ROLE       | EMP ID    | EMAIL / USERNAME      | PASSWORD     | MOBILE');
  console.log('------------------------------------------------------------------------');
  for (const u of SEED_USERS) {
    const role = (u.Role || '').padEnd(10);
    const empId = (u.EmpId || '').padEnd(9);
    const email = (u.EmailId || '').padEnd(21);
    const pass = (u.PlainPassword || '').padEnd(12);
    const mobile = (u.Mobile || '').padEnd(10);
    console.log(` ${role} | ${empId} | ${email} | ${pass} | ${mobile}`);
  }
  console.log('========================================================================');
  console.log(' Note: You can log in using either EmpId, Email, or Mobile as identifier.');
  console.log(' Login API Endpoint: POST /api/auth/login or POST /auth/login.php');
  console.log('========================================================================\n');
}

// Allow direct CLI execution: node src/config/seed.js
if (require.main === module) {
  seedDatabase().then(() => {
    process.exit(0);
  }).catch(err => {
    console.error('Fatal Seeder Error:', err);
    process.exit(1);
  });
}

module.exports = {
  seedDatabase,
  SEED_USERS,
  DEFAULT_OFFICES,
  DEFAULT_TENANT,
  printCredentialsSummary
};
