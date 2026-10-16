const db = require('../../config/db');
const { calculateWeeklyOffs } = require('./salaryHelper');

const calculateSalary = async (req, res) => {
  const response = { success: false, message: '', data: null };

  const now = new Date();
  let currentMonth = now.getMonth() + 1;
  let currentYear = now.getFullYear();

  let month, year;
  if (currentMonth === 1) {
    month = 12;
    year = currentYear - 1;
  } else {
    month = currentMonth - 1;
    year = currentYear;
  }

  try {
    const [existRows] = await db.query(
      'SELECT COUNT(*) as count FROM salary_records WHERE Month = ? AND Year = ?',
      [month, year]
    );

    if (existRows[0].count > 0) {
      throw new Error('Data for the specified month and year already exists.');
    }

    const [employees] = await db.query(
      'SELECT EmpId, Name, Mobile, Designation, Shift, WeekOff FROM Employees'
    );

    if (!employees || employees.length === 0) {
      throw new Error('No employees found.');
    }

    const [salariesRows] = await db.query(
      'SELECT EmpId, Basic_Salary FROM salary_structure'
    );
    const salariesMap = {};
    for (const s of salariesRows) {
      salariesMap[s.EmpId] = s.Basic_Salary;
    }

    const [attRows] = await db.query(
      `SELECT EmpId, COUNT(DISTINCT InTime) AS PresentDays
       FROM Attendance
       WHERE MONTH(InTime) = ? AND YEAR(InTime) = ?
       GROUP BY EmpId`,
      [month, year]
    );
    const attendanceMap = {};
    for (const a of attRows) {
      attendanceMap[a.EmpId] = a.PresentDays;
    }

    const monthStr = month < 10 ? '0' + month : month;
    const firstDay = `${year}-${monthStr}-01`;
    const lastDayOfMonthDate = new Date(year, month, 0);
    const lastDay = `${year}-${monthStr}-${String(lastDayOfMonthDate.getDate()).padStart(2, '0')}`;
    const totalDaysInMonth = lastDayOfMonthDate.getDate();

    const [leaveRows] = await db.query(
      `SELECT EmpId, SUM(
         DATEDIFF(
           LEAST(?, EndDate),
           GREATEST(?, StartDate)
         ) + 1
       ) AS LeaveDays
       FROM Leaves
       WHERE StartDate <= ? AND EndDate >= ?
       GROUP BY EmpId`,
      [lastDay, firstDay, lastDay, firstDay]
    );
    const leavesMap = {};
    for (const l of leaveRows) {
      leavesMap[l.EmpId] = l.LeaveDays;
    }

    const [holRows] = await db.query(
      `SELECT COUNT(date) AS HolidayCount
       FROM Holidays
       WHERE MONTH(date) = ? AND YEAR(date) = ?`,
      [month, year]
    );
    const holidays = holRows.length > 0 ? holRows[0].HolidayCount : 0;

    const salariesData = [];
    for (const emp of employees) {
      const empId = emp.EmpId;
      const basicSalary = parseFloat(salariesMap[empId] || 0);
      const presentDays = parseInt(attendanceMap[empId] || 0, 10);
      const leaveDays = parseInt(leavesMap[empId] || 0, 10);
      const weekOffs = calculateWeeklyOffs(emp.WeekOff, month, year, totalDaysInMonth);
      const actualWorkingDays = totalDaysInMonth - (holidays + weekOffs);

      const calculatedSalary =
        actualWorkingDays > 0 ? (basicSalary / actualWorkingDays) * presentDays : 0;

      salariesData.push({
        EmpId: empId,
        Name: emp.Name,
        Designation: emp.Designation,
        BasicSalary: basicSalary,
        Breakdown: {
          TotalDaysInMonth: totalDaysInMonth,
          Holidays: holidays,
          WeekOffs: weekOffs,
          PresentDays: presentDays,
          LeaveDays: leaveDays,
          ActualWorkingDays: actualWorkingDays
        },
        Salary: parseFloat(calculatedSalary.toFixed(2))
      });
    }

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const insertSql = `
        INSERT INTO salary_records 
        (EmpId, Name, Designation, BasicSalary, Month, Year, TotalDaysInMonth, Holidays, WeekOffs, PresentDays, LeaveDays, ActualWorkingDays, Salary) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      for (const d of salariesData) {
        await conn.execute(insertSql, [
          d.EmpId,
          d.Name,
          d.Designation,
          d.BasicSalary,
          month,
          year,
          totalDaysInMonth,
          holidays,
          d.Breakdown.WeekOffs,
          d.Breakdown.PresentDays,
          d.Breakdown.LeaveDays,
          d.Breakdown.ActualWorkingDays,
          d.Salary
        ]);
      }

      await conn.commit();
      response.success = true;
      response.data = salariesData;
      return res.json(response);
    } catch (txErr) {
      await conn.rollback();
      throw txErr;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('Error in calculateSalary:', err);
    response.message = err.message;
    return res.status(500).json(response);
  }
};

// 3. Get Salary (src/salary/get_salary.php);

module.exports = calculateSalary;
