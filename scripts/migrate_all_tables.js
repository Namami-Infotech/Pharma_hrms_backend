const db = require('../src/config/db');

/**
 * Migration definition for all tables and columns needed by the 32 modules.
 */
const TABLES_MIGRATIONS = [
  // 1. New Missing Tables
  {
    table: 'assets_issue',
    createSql: `CREATE TABLE IF NOT EXISTS \`assets_issue\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`emp_id\` VARCHAR(50) NOT NULL,
      \`asset_id\` INT NOT NULL,
      \`asset_name\` VARCHAR(150) DEFAULT NULL,
      \`serial_number\` VARCHAR(100) DEFAULT NULL,
      \`make_name\` VARCHAR(100) DEFAULT NULL,
      \`model_name\` VARCHAR(100) DEFAULT NULL,
      \`status\` VARCHAR(50) DEFAULT 'Issued',
      \`remark\` TEXT DEFAULT NULL,
      \`issue_date\` DATETIME DEFAULT CURRENT_TIMESTAMP,
      \`return_date\` DATETIME DEFAULT NULL,
      \`Tenent_Id\` INT DEFAULT 1,
      \`create_time\` DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX (\`emp_id\`),
      INDEX (\`asset_id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
  },
  {
    table: 'Dealers',
    createSql: `CREATE TABLE IF NOT EXISTS \`Dealers\` (
      \`DealerID\` INT AUTO_INCREMENT PRIMARY KEY,
      \`DealerName\` VARCHAR(150) NOT NULL,
      \`Address\` TEXT DEFAULT NULL,
      \`ContactInfo\` VARCHAR(100) DEFAULT NULL,
      \`LatLong\` VARCHAR(100) DEFAULT NULL,
      \`CompanyName\` VARCHAR(150) DEFAULT NULL,
      \`MailId\` VARCHAR(150) DEFAULT NULL,
      \`Remarks\` TEXT DEFAULT NULL,
      \`AddedByEmpId\` VARCHAR(50) DEFAULT NULL,
      \`IsActive\` TINYINT DEFAULT 1,
      \`Tenent_Id\` INT DEFAULT 1,
      \`CreateDate\` DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX (\`DealerName\`),
      INDEX (\`AddedByEmpId\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
  },
  {
    table: 'ExpenseDetails',
    createSql: `CREATE TABLE IF NOT EXISTS \`ExpenseDetails\` (
      \`detailId\` INT AUTO_INCREMENT PRIMARY KEY,
      \`batchId\` VARCHAR(100) NOT NULL,
      \`empId\` VARCHAR(50) NOT NULL,
      \`expenseDate\` DATE NOT NULL,
      \`expenseType\` VARCHAR(100) NOT NULL,
      \`expenseAmount\` DECIMAL(12, 2) NOT NULL,
      \`image\` VARCHAR(255) DEFAULT NULL,
      \`Status\` VARCHAR(50) DEFAULT 'Pending',
      \`Remarks\` TEXT DEFAULT NULL,
      \`ApprovedBy\` VARCHAR(50) DEFAULT NULL,
      \`Tenent_Id\` INT DEFAULT 1,
      \`create_time\` DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX (\`empId\`),
      INDEX (\`batchId\`),
      INDEX (\`Status\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
  },
  {
    table: 'TravelExpenses',
    createSql: `CREATE TABLE IF NOT EXISTS \`TravelExpenses\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`batchId\` VARCHAR(100) NOT NULL,
      \`empId\` VARCHAR(50) NOT NULL,
      \`travelDate\` DATE NOT NULL,
      \`travelFrom\` VARCHAR(150) NOT NULL,
      \`travelTo\` VARCHAR(150) NOT NULL,
      \`travelType\` VARCHAR(100) NOT NULL,
      \`status\` VARCHAR(50) DEFAULT 'Pending',
      \`remark\` TEXT DEFAULT NULL,
      \`ApprovedBy\` VARCHAR(50) DEFAULT NULL,
      \`Tenent_Id\` INT DEFAULT 1,
      \`create_time\` DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX (\`empId\`),
      INDEX (\`batchId\`),
      INDEX (\`status\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
  },
  {
    table: 'Visit',
    createSql: `CREATE TABLE IF NOT EXISTS \`Visit\` (
      \`VisitID\` INT AUTO_INCREMENT PRIMARY KEY,
      \`EmpId\` VARCHAR(50) NOT NULL,
      \`DealerID\` INT DEFAULT NULL,
      \`DealerName\` VARCHAR(150) DEFAULT NULL,
      \`VisitCount\` VARCHAR(10) DEFAULT 'A',
      \`VisitLatLong\` VARCHAR(100) DEFAULT NULL,
      \`VisitTime\` DATETIME DEFAULT CURRENT_TIMESTAMP,
      \`Status\` VARCHAR(50) DEFAULT 'Planned',
      \`Plan_Visit\` DATETIME DEFAULT NULL,
      \`CompanyName\` VARCHAR(150) DEFAULT NULL,
      \`MobileNo\` VARCHAR(20) DEFAULT NULL,
      \`Mode\` VARCHAR(50) DEFAULT NULL,
      \`Purpose\` VARCHAR(255) DEFAULT NULL,
      \`Remarks\` TEXT DEFAULT NULL,
      \`Attachment\` VARCHAR(255) DEFAULT NULL,
      \`old_visit\` INT DEFAULT NULL,
      \`LatLong\` VARCHAR(100) DEFAULT NULL,
      \`Tenent_Id\` INT DEFAULT 1,
      \`create_time\` DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX (\`EmpId\`),
      INDEX (\`DealerID\`),
      INDEX (\`Plan_Visit\`),
      INDEX (\`Status\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
  }
];

// Required columns on existing tables to guarantee all module queries succeed
const REQUIRED_COLUMNS = [
  { table: 'Employees', column: 'office_leave_date', def: 'DATE DEFAULT NULL' },
  { table: 'Employees', column: 'reason', def: 'TEXT DEFAULT NULL' },
  { table: 'EmployeeOffice', column: 'EmpId', def: 'VARCHAR(50) DEFAULT NULL' },
  { table: 'EmployeeLeave', column: 'CompOffDates', def: 'TEXT DEFAULT NULL' },
  { table: 'Leaves', column: 'category', def: 'VARCHAR(50) DEFAULT "Annual"' },
  { table: 'Leaves', column: 'CreatedAt', def: 'DATETIME DEFAULT CURRENT_TIMESTAMP' },
  { table: 'Regularisation', column: 'RegID', def: 'INT DEFAULT NULL' },
  { table: 'Regularisation', column: 'InActivityId', def: 'VARCHAR(50) DEFAULT NULL' },
  { table: 'Regularisation', column: 'OutActivityId', def: 'VARCHAR(50) DEFAULT NULL' },
  { table: 'Regularisation', column: 'UpdateDate', def: 'DATETIME DEFAULT NULL' },
  { table: 'Regularisation', column: 'UpdatedBy', def: 'VARCHAR(50) DEFAULT NULL' },
  { table: 'assets', column: 'product_name', def: 'VARCHAR(150) DEFAULT NULL' },
  { table: 'assets', column: 'added_date', def: 'VARCHAR(50) DEFAULT NULL' },
  { table: 'Attendance', column: 'DateTime', def: 'DATE DEFAULT NULL' },
  { table: 'Attendance', column: 'InLatLong', def: 'VARCHAR(100) DEFAULT NULL' },
  { table: 'Attendance', column: 'OutLatLong', def: 'VARCHAR(100) DEFAULT NULL' },
  { table: 'Attendance', column: 'InEvent', def: 'VARCHAR(50) DEFAULT "In"' },
  { table: 'Attendance', column: 'OutEvent', def: 'VARCHAR(50) DEFAULT "Out"' },
  { table: 'Attendance', column: 'RegulariseStatus', def: 'TINYINT DEFAULT 0' },
  { table: 'Activity', column: 'ActivityId', def: 'INT DEFAULT NULL' },
  { table: 'Activity', column: 'DId', def: 'VARCHAR(100) DEFAULT NULL' },
  { table: 'Activity', column: 'MappingId', def: 'VARCHAR(100) DEFAULT NULL' },
  { table: 'Activity', column: 'MenuId', def: 'INT DEFAULT NULL' },
  { table: 'Activity_New', column: 'ActivityId', def: 'INT DEFAULT NULL' },
  { table: 'Activity_New', column: 'DId', def: 'VARCHAR(100) DEFAULT NULL' },
  { table: 'Activity_New', column: 'MappingId', def: 'VARCHAR(100) DEFAULT NULL' },
  { table: 'Activity_New', column: 'MenuId', def: 'INT DEFAULT NULL' },
  { table: 'TransactionHDR', column: 'SRNo', def: 'INT DEFAULT NULL' },
  { table: 'Visits', column: 'SourceLatLong', def: 'VARCHAR(100) DEFAULT NULL' },
  { table: 'Visits', column: 'SourceTime', def: 'DATETIME DEFAULT NULL' },
  { table: 'Visits', column: 'DestinationLatLong', def: 'VARCHAR(100) DEFAULT NULL' },
  { table: 'Visits', column: 'DestinationTime', def: 'DATETIME DEFAULT NULL' },
  { table: 'Visits', column: 'Distance', def: 'DECIMAL(10, 2) DEFAULT 0.00' },
  { table: 'Visits', column: 'VisitDateTime', def: 'DATETIME DEFAULT NULL' },
  { table: 'Visits', column: 'SourceEvent', def: 'VARCHAR(150) DEFAULT NULL' },
  { table: 'Visits', column: 'DestinationEvent', def: 'VARCHAR(150) DEFAULT NULL' },
  { table: 'Devices', column: 'LoginId', def: 'VARCHAR(100) DEFAULT NULL' },
  { table: 'Devices', column: 'Mobile', def: 'VARCHAR(20) DEFAULT NULL' },
  { table: 'Devices', column: 'Token', def: 'TEXT DEFAULT NULL' },
  { table: 'Devices', column: 'Make', def: 'VARCHAR(100) DEFAULT NULL' },
  { table: 'Devices', column: 'Model', def: 'VARCHAR(100) DEFAULT NULL' },
  { table: 'Devices', column: 'OS', def: 'VARCHAR(50) DEFAULT NULL' },
  { table: 'Devices', column: 'OSVer', def: 'VARCHAR(50) DEFAULT NULL' },
  { table: 'Devices', column: 'AppVer', def: 'VARCHAR(50) DEFAULT NULL' },
  { table: 'Devices', column: 'NetworkType', def: 'VARCHAR(50) DEFAULT NULL' },
  { table: 'Devices', column: 'Active', def: 'TINYINT DEFAULT 1' },
  { table: 'Devices', column: 'Registered', def: 'DATETIME DEFAULT NULL' },
  { table: 'Devices', column: 'Update', def: 'DATETIME DEFAULT NULL' },
  { table: 'Devices_Audit', column: 'Mobile', def: 'VARCHAR(20) DEFAULT NULL' },
  { table: 'Devices_Audit', column: 'Token', def: 'TEXT DEFAULT NULL' },
  { table: 'Devices_Audit', column: 'Make', def: 'VARCHAR(100) DEFAULT NULL' },
  { table: 'Devices_Audit', column: 'Model', def: 'VARCHAR(100) DEFAULT NULL' },
  { table: 'Devices_Audit', column: 'OS', def: 'VARCHAR(50) DEFAULT NULL' },
  { table: 'Devices_Audit', column: 'OSVer', def: 'VARCHAR(50) DEFAULT NULL' },
  { table: 'Devices_Audit', column: 'AppVer', def: 'VARCHAR(50) DEFAULT NULL' },
  { table: 'Devices_Audit', column: 'NetworkType', def: 'VARCHAR(50) DEFAULT NULL' },
  { table: 'Devices_Audit', column: 'Active', def: 'TINYINT DEFAULT 1' },
  { table: 'Devices_Audit', column: 'Registered', def: 'DATETIME DEFAULT NULL' },
  { table: 'Devices_Audit', column: 'Update', def: 'DATETIME DEFAULT NULL' },
  { table: 'Devices_Audit', column: 'Server_Date', def: 'DATETIME DEFAULT NULL' }
];

async function runAutoMigration() {
  console.log('[Migration] Starting database migration & schema sync...');

  // 1. Create missing tables
  for (const m of TABLES_MIGRATIONS) {
    try {
      await db.query(m.createSql);
      console.log(`[Migration] ✓ Table verified/created: ${m.table}`);
    } catch (err) {
      console.warn(`[Migration] Table warning for ${m.table}:`, err.message);
    }
  }

  // 2. Fetch all existing tables and columns
  const [tables] = await db.query('SHOW TABLES');
  const tableNames = tables.map(r => Object.values(r)[0]);
  const existingTablesMap = new Map();
  for (const t of tableNames) {
    existingTablesMap.set(t.toLowerCase(), t);
  }

  // 3. Add any missing columns
  for (const colInfo of REQUIRED_COLUMNS) {
    const actualTable = existingTablesMap.get(colInfo.table.toLowerCase());
    if (!actualTable) continue;

    try {
      const [colRows] = await db.query(`DESCRIBE \`${actualTable}\``);
      const existingCols = new Set(colRows.map(c => c.Field.toLowerCase()));

      if (!existingCols.has(colInfo.column.toLowerCase())) {
        const alterSql = `ALTER TABLE \`${actualTable}\` ADD COLUMN \`${colInfo.column}\` ${colInfo.def}`;
        await db.query(alterSql);
        console.log(`[Migration] ✓ Added missing column '${colInfo.column}' to '${actualTable}'`);
      }
    } catch (err) {
      console.warn(`[Migration] Column warning for ${colInfo.table}.${colInfo.column}:`, err.message);
    }
  }

  // 4. Also relax Assets.AssetName if it is NOT NULL
  try {
    const actualAssets = existingTablesMap.get('assets');
    if (actualAssets) {
      await db.query(`ALTER TABLE \`${actualAssets}\` MODIFY COLUMN \`AssetName\` VARCHAR(150) NULL DEFAULT NULL`);
    }
  } catch (_) {}

  // 5. Populate RegID = id for Regularisation if NULL
  try {
    const actualReg = existingTablesMap.get('regularisation');
    if (actualReg) {
      await db.query(`UPDATE \`${actualReg}\` SET \`RegID\` = \`id\` WHERE \`RegID\` IS NULL`);
    }
  } catch (_) {}

  // 6. Populate ActivityId = id for Activity if NULL
  try {
    const actualAct = existingTablesMap.get('activity');
    if (actualAct) {
      await db.query(`UPDATE \`${actualAct}\` SET \`ActivityId\` = \`id\` WHERE \`ActivityId\` IS NULL`);
    }
  } catch (_) {}

  // 7. Populate SRNo = Id for TransactionHDR if NULL
  try {
    const actualTh = existingTablesMap.get('transactionhdr');
    if (actualTh) {
      await db.query(`UPDATE \`${actualTh}\` SET \`SRNo\` = \`Id\` WHERE \`SRNo\` IS NULL`);
    }
  } catch (_) {}

  console.log('[Migration] Database migration completed successfully.');
}

if (require.main === module) {
  runAutoMigration().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = {
  runAutoMigration,
  TABLES_MIGRATIONS,
  REQUIRED_COLUMNS
};
