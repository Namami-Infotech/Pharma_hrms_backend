const db = require('../../config/db');

function getDayDiffInclusive(fromDateStr, toDateStr) {
  const from = new Date(fromDateStr);
  const to = new Date(toDateStr);
  const diffTime = Math.abs(to - from);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Calculates first eligible accrual month based on creation time rules:
 * - If employee was created on the 1st of the month (day === 1): eligible for that month.
 * - If employee was created after the 1st (day > 1): that month gets NO leave; accrual starts next calendar month.
 */
function getFirstEligibleMonth(dateInput) {
  if (!dateInput) return null;

  let dateStr = '';
  if (dateInput instanceof Date) {
    const y = dateInput.getFullYear();
    const m = String(dateInput.getMonth() + 1).padStart(2, '0');
    const d = String(dateInput.getDate()).padStart(2, '0');
    dateStr = `${y}-${m}-${d}`;
  } else {
    dateStr = String(dateInput).trim();
  }

  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10); // 1-12
  const day = parseInt(match[3], 10); // 1-31

  let eligibleYear = year;
  let eligibleMonth = month;

  if (day > 1) {
    // Created after 1st: creation month is not eligible
    eligibleMonth += 1;
    if (eligibleMonth > 12) {
      eligibleMonth = 1;
      eligibleYear += 1;
    }
  }

  return {
    year: eligibleYear,
    month: eligibleMonth,
    dateStr: `${eligibleYear}-${String(eligibleMonth).padStart(2, '0')}-01`
  };
}

/**
 * Ensures Casual Leave accrual and carry-forward for an employee.
 * - 1 CL per eligible calendar month.
 * - Unused CL carries forward.
 * - Based on create_time (or CreateDate):
 *     - If created on 1st of month: gets 1 CL for that month.
 *     - If created after 1st of month: 0 CL for creation month; starts next month.
 */
const ensureCasualLeaveAccrual = async (empid, executor = db) => {
  if (!empid) return;

  await executor.query(`
    CREATE TABLE IF NOT EXISTS EmployeeLeaveAccrual (
      EmpId VARCHAR(50) PRIMARY KEY,
      LastAccruedMonth DATE NOT NULL
    )
  `);

  // Fetch employee creation time and tenant
  const [empRows] = await executor.query(
    'SELECT EmpId, create_time, CreateDate, JoinDate, Tenent_Id FROM Employees WHERE EmpId = ? LIMIT 1',
    [empid]
  );

  const emp = empRows && empRows.length > 0 ? empRows[0] : null;
  const tenantId = emp?.Tenent_Id || 1;
  // Use create_time as primary reference, fallback to CreateDate or JoinDate
  const rawCreationDate = emp?.create_time || emp?.CreateDate || emp?.JoinDate;

  const now = new Date();
  const currYear = now.getFullYear();
  const currMonth = now.getMonth() + 1; // 1-12
  const currentMonthStartStr = `${currYear}-${String(currMonth).padStart(2, '0')}-01`;

  const eligible = getFirstEligibleMonth(rawCreationDate);

  const [accrualRows] = await executor.query(
    'SELECT LastAccruedMonth FROM EmployeeLeaveAccrual WHERE EmpId = ? LIMIT 1',
    [empid]
  );

  if (accrualRows.length === 0) {
    // First time initializing this employee
    let totalEligibleAccrual = 0;

    if (eligible) {
      if (
        eligible.year < currYear ||
        (eligible.year === currYear && eligible.month <= currMonth)
      ) {
        totalEligibleAccrual =
          (currYear - eligible.year) * 12 + (currMonth - eligible.month) + 1;
      }
    }

    // Check if employee already used any CL in Leaves table
    const [usedLeaveRows] = await executor.query(
      `SELECT COALESCE(SUM(TotalDays), 0) AS usedCL 
       FROM Leaves 
       WHERE EmpId = ? AND (category = 'CL' OR LeaveType = 'CL') AND Status != 'Rejected'`,
      [empid]
    );
    const usedCL = parseFloat(usedLeaveRows[0]?.usedCL || 0);
    const initialBalance = Math.max(0, totalEligibleAccrual - usedCL);

    // Save LastAccruedMonth as current month
    await executor.execute(
      'INSERT INTO EmployeeLeaveAccrual (EmpId, LastAccruedMonth) VALUES (?, ?) ON DUPLICATE KEY UPDATE LastAccruedMonth = ?',
      [empid, currentMonthStartStr, currentMonthStartStr]
    );

    // Insert or update EmployeeLeave
    const [leaveRows] = await executor.query(
      'SELECT id FROM EmployeeLeave WHERE EmpId = ? LIMIT 1',
      [empid]
    );

    if (leaveRows.length > 0) {
      await executor.execute(
        'UPDATE EmployeeLeave SET CL = ? WHERE EmpId = ?',
        [initialBalance, empid]
      );
    } else {
      await executor.execute(
        'INSERT INTO EmployeeLeave (EmpId, CL, Tenent_Id) VALUES (?, ?, ?)',
        [empid, initialBalance, tenantId]
      );
    }
    return;
  }

  // Already tracked in EmployeeLeaveAccrual, check if new months have passed
  const lastAccruedStr = String(accrualRows[0].LastAccruedMonth);
  const lastMatch = lastAccruedStr.match(/^(\d{4})-(\d{2})/);
  if (!lastMatch) return;

  const lastYear = parseInt(lastMatch[1], 10);
  const lastMonth = parseInt(lastMatch[2], 10);

  let monthsToAccrue = (currYear - lastYear) * 12 + (currMonth - lastMonth);

  // If employee was not yet eligible during lastAccrued
  if (eligible) {
    if (
      eligible.year > currYear ||
      (eligible.year === currYear && eligible.month > currMonth)
    ) {
      // Still in future, ineligible
      monthsToAccrue = 0;
    } else if (
      eligible.year > lastYear ||
      (eligible.year === lastYear && eligible.month > lastMonth)
    ) {
      monthsToAccrue =
        (currYear - eligible.year) * 12 + (currMonth - eligible.month) + 1;
    }
  }

  if (monthsToAccrue > 0) {
    await executor.execute(
      'UPDATE EmployeeLeave SET CL = COALESCE(CL, 0) + ? WHERE EmpId = ?',
      [monthsToAccrue, empid]
    );
    await executor.execute(
      'UPDATE EmployeeLeaveAccrual SET LastAccruedMonth = ? WHERE EmpId = ?',
      [currentMonthStartStr, empid]
    );
  }
};

/**
 * Resets / recalculates leave balances for all employees according to create_time.
 */
const recalculateAllEmployeeLeaves = async (executor = db) => {
  const [employees] = await executor.query('SELECT EmpId FROM Employees');
  for (const emp of employees) {
    await executor.execute('DELETE FROM EmployeeLeaveAccrual WHERE EmpId = ?', [emp.EmpId]);
    await ensureCasualLeaveAccrual(emp.EmpId, executor);
  }
};

module.exports = {
  getDayDiffInclusive,
  getFirstEligibleMonth,
  ensureCasualLeaveAccrual,
  recalculateAllEmployeeLeaves
};
