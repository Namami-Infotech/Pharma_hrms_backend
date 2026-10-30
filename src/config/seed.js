const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const db = require('./db');

/**
 * Seed data definition for SAFEGUARD HRMS
 */
const DEFAULT_TENANT = {
  Tenent_ID: 1,
  Id: 1,
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
  }
];

const DEFAULT_HOLIDAYS = [
  { date: '2026-01-26', title: 'Republic Day', Tenent_Id: 1 },
  { date: '2026-08-15', title: 'Independence Day', Tenent_Id: 1 },
  { date: '2026-10-02', title: 'Gandhi Jayanti', Tenent_Id: 1 },
  { date: '2026-12-25', title: 'Christmas Day', Tenent_Id: 1 }
];

/**
 * Ensures all database tables are created from schema.sql before seeding
 */
async function ensureTablesExist() {
  const schemaPath = path.join(__dirname, '../../scripts/schema.sql');
  if (!fs.existsSync(schemaPath)) {
    console.warn('[Database Seeder] scripts/schema.sql not found at:', schemaPath);
    return;
  }

  try {
    const sql = fs.readFileSync(schemaPath, 'utf-8');
    const statements = sql
      .split(/;\s*[\r\n]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0 && /CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS/i.test(s));

    console.log(`[Database Seeder] Checking/creating ${statements.length} schema tables...`);

    for (const stmt of statements) {
      try {
        await db.query(stmt);
      } catch (tableErr) {
        // Table might already exist or minor dialect difference, continue
        console.warn(`[Database Seeder] Table creation note: ${tableErr.message}`);
      }
    }
    console.log('[Database Seeder] ✓ Schema tables verified.');

    // Auto-migrate any missing columns for all 32 modules
    try {
      const { runAutoMigration } = require('../../scripts/migrate_all_tables');
      await runAutoMigration();
    } catch (migErr) {
      console.warn('[Database Seeder] Column migration note:', migErr.message);
    }
  } catch (err) {
    console.error('[Database Seeder] Error during table creation:', err.message);
  }
}

/**
 * Helper to resolve case-insensitive table name (for Linux vs Windows compatibility)
 */
async function getTableName(candidates) {
  for (const name of candidates) {
    try {
      await db.query(`SELECT 1 FROM \`${name}\` LIMIT 1`);
      return `\`${name}\``;
    } catch (e) {
      // Try next candidate
    }
  }
  return `\`${candidates[0]}\``;
}

/**
 * Main seeding function. Idempotent: checks for existence before inserting/updating.
 */
async function seedDatabase() {
  console.log('\n[Database Seeder] Initializing database check & seed process...');

  try {
    // Step 1: Ensure all tables exist in the database
    await ensureTablesExist();

    // Resolve case-insensitive table names
    const tenentTable = await getTableName(['Tenent', 'tenent']);
    const employeeOfficeTable = await getTableName(['EmployeeOffice', 'employeeoffice']);
    const employeesTable = await getTableName(['Employees', 'employees']);
    const employeeLeaveTable = await getTableName(['EmployeeLeave', 'employeeleave']);
    const holidaysTable = await getTableName(['Holidays', 'holidays']);

    // Step 2: Seed Tenant
    try {
      const [existingTenants] = await db.query(
        `SELECT Tenent_ID FROM ${tenentTable} WHERE Tenent_ID = ? LIMIT 1`,
        [DEFAULT_TENANT.Tenent_ID]
      );
      if (!existingTenants || existingTenants.length === 0) {
        await db.execute(
          `INSERT INTO ${tenentTable} (Tenent_ID, Id, Tenent_Name, Menu, IsActive) VALUES (?, ?, ?, ?, ?)`,
          [DEFAULT_TENANT.Tenent_ID, DEFAULT_TENANT.Id, DEFAULT_TENANT.Tenent_Name, DEFAULT_TENANT.Menu, DEFAULT_TENANT.IsActive]
        );
        console.log(`[Database Seeder] ✓ Tenant '${DEFAULT_TENANT.Tenent_Name}' created.`);
      }
    } catch (err) {
      console.warn('[Database Seeder] Tenant table check/seed warning:', err.message);
    }

    // Step 3: Seed Offices
    try {
      for (const office of DEFAULT_OFFICES) {
        const [existing] = await db.query(
          `SELECT id FROM ${employeeOfficeTable} WHERE id = ? LIMIT 1`,
          [office.id]
        );
        if (!existing || existing.length === 0) {
          await db.execute(
            `INSERT INTO ${employeeOfficeTable} (id, OfficeName, OfficeAddress, LatLong, Distance, Tenent_Id, IsActive) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [office.id, office.OfficeName, office.OfficeAddress, office.LatLong, office.Distance, office.Tenent_Id, office.IsActive]
          );
          console.log(`[Database Seeder] ✓ Office '${office.OfficeName}' created.`);
        }
      }
    } catch (err) {
      console.warn('[Database Seeder] Office table check/seed warning:', err.message);
    }

    // Step 4: Seed Users / Employees
    for (const user of SEED_USERS) {
      const hashedPassword = bcrypt.hashSync(user.PlainPassword, 10);
      try {
        const [existing] = await db.query(
          `SELECT EmpId FROM ${employeesTable} WHERE EmpId = ? LIMIT 1`,
          [user.EmpId]
        );

        if (!existing || existing.length === 0) {
          // Insert new user
          await db.execute(
            `INSERT INTO ${employeesTable} 
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
            `UPDATE ${employeesTable} 
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

        // Step 5: Ensure EmployeeLeave record exists
        try {
          const [existingLeave] = await db.query(
            `SELECT id FROM ${employeeLeaveTable} WHERE EmpId = ? LIMIT 1`,
            [user.EmpId]
          );
          if (!existingLeave || existingLeave.length === 0) {
            await db.execute(
              `INSERT INTO ${employeeLeaveTable} 
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

    // Step 6: Seed sample holidays if empty
    try {
      const [holidayCount] = await db.query(`SELECT COUNT(*) as cnt FROM ${holidaysTable} WHERE Tenent_Id = 1`);
      if (holidayCount && holidayCount[0].cnt === 0) {
        for (const h of DEFAULT_HOLIDAYS) {
          await db.execute(
            `INSERT INTO ${holidaysTable} (date, title, Tenent_Id) VALUES (?, ?, ?)`,
            [h.date, h.title, h.Tenent_Id]
          );
        }
        console.log('[Database Seeder] ✓ Sample holidays populated.');
      }
    } catch (err) {
      // Non-blocking
    }

    // Step 7: Ensure modules and role_permissions tables and active statuses are seeded
    try {
      const { initModuleTables } = require('./init_module_tables');
      await initModuleTables();
      console.log('[Database Seeder] ✓ Modules and role permissions verified.');
    } catch (modErr) {
      console.warn('[Database Seeder] Error verifying modules tables:', modErr.message);
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
  ensureTablesExist,
  SEED_USERS,
  DEFAULT_OFFICES,
  DEFAULT_TENANT,
  printCredentialsSummary
};
