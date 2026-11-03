const db = require('../../config/db');

function getDayDiffInclusive(fromDateStr, toDateStr) {
  const from = new Date(fromDateStr);
  const to = new Date(toDateStr);
  const diffTime = Math.abs(to - from);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

const ensureCasualLeaveAccrual = async (empid) => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS EmployeeLeaveAccrual (
      EmpId VARCHAR(50) PRIMARY KEY,
      LastAccruedMonth DATE NOT NULL
    )
  `);

  const [rows] = await db.query(
    'SELECT LastAccruedMonth FROM EmployeeLeaveAccrual WHERE EmpId = ? LIMIT 1',
    [empid]
  );
  const currentMonth = new Date();
  const currentMonthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);

  if (rows.length === 0) {
    await db.execute(
      'INSERT INTO EmployeeLeaveAccrual (EmpId, LastAccruedMonth) VALUES (?, ?)',
      [empid, currentMonthStart]
    );
    const [leaveRows] = await db.query(
      'SELECT id FROM EmployeeLeave WHERE EmpId = ? LIMIT 1',
      [empid]
    );
    if (leaveRows.length > 0) {
      await db.execute(
        'UPDATE EmployeeLeave SET CL = COALESCE(CL, 0) + 1 WHERE EmpId = ?',
        [empid]
      );
    } else {
      await db.execute(
        'INSERT INTO EmployeeLeave (EmpId, CL, Tenent_Id) VALUES (?, 1, 1)',
        [empid]
      );
    }
    return;
  }

  const lastAccruedMonth = new Date(rows[0].LastAccruedMonth);
  const monthsToAccrue =
    (currentMonthStart.getFullYear() - lastAccruedMonth.getFullYear()) * 12 +
    currentMonthStart.getMonth() - lastAccruedMonth.getMonth();

  if (monthsToAccrue > 0) {
    await db.execute(
      'UPDATE EmployeeLeave SET CL = COALESCE(CL, 0) + ? WHERE EmpId = ?',
      [monthsToAccrue, empid]
    );
    await db.execute(
      'UPDATE EmployeeLeaveAccrual SET LastAccruedMonth = ? WHERE EmpId = ?',
      [currentMonthStart, empid]
    );
  }
};

module.exports = { getDayDiffInclusive, ensureCasualLeaveAccrual };
