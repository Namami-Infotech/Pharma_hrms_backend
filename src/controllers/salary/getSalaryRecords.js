const db = require('../../config/db');
const { calculateWeeklyOffs } = require('./salaryHelper');
const { ensureCasualLeaveAccrual } = require('../leave/leaveHelper');

const getSalaryRecords = async (req, res) => {
  const response = { success: false, message: '', data: [] };

  const query = req.query || {};
  const body = req.body || {};
  const month = parseInt(query.month || body.month || (new Date().getMonth() + 1), 10);
  const year = parseInt(query.year || body.year || new Date().getFullYear(), 10);
  const tenantId = query.Tenent_Id || query.tenant_id || body.Tenent_Id || null;

  if (isNaN(month) || isNaN(year)) {
    response.message = 'Month and year are required and must be numbers.';
    return res.status(400).json(response);
  }

  // 1. Month restriction: salary records only available for previous completed months
  // "in salary slip and salary details will come only for previous month from current month"
  const now = new Date();
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const maxAllowedYear = prevDate.getFullYear();
  const maxAllowedMonth = prevDate.getMonth() + 1;

  if (year > maxAllowedYear || (year === maxAllowedYear && month > maxAllowedMonth)) {
    response.success = false;
    response.message = 'Salary records can only be generated for completed months (previous month). Current and future months are not completed yet.';
    response.data = [];
    return res.json(response);
  }

  const daysInMonth = new Date(year, month, 0).getDate();
  const monthStr = month < 10 ? '0' + month : month;
  const firstDay = `${year}-${monthStr}-01`;
  const lastDay = `${year}-${monthStr}-${String(daysInMonth).padStart(2, '0')}`;

  try {
    // 1. Fetch holidays count
    let holidays = 0;
    try {
      const [holRows] = await db.query(
        `SELECT COUNT(date) AS HolidayCount FROM Holidays WHERE MONTH(date) = ? AND YEAR(date) = ?`,
        [month, year]
      );
      if (holRows && holRows.length > 0) holidays = parseInt(holRows[0].HolidayCount, 10) || 0;
    } catch (_) {}

    // 2. Fetch all active employees who joined on or before this month
    // "joining month se pehle ka generate ni hoga"
    let empQuery = `
      SELECT 
        e.id, e.EmpId, e.Name, e.Department, e.Designation, e.Shift, e.WeekOff, e.JoinDate,
        COALESCE(e.da, 0) as da,
        COALESCE(ss.gross_salary, 0) as ss_gross,
        COALESCE(ss.basic_salary, s_old.Basic_Salary, e.basic_salary, 0) as basic_salary,
        COALESCE(ss.hra, e.hra, 0) as hra,
        COALESCE(ss.conveyance, e.conveyance, 0) as conveyance,
        COALESCE(ss.special_allowance, e.special_allowance, 0) as special_allowance,
        COALESCE(ss.epf, e.pf_deduction, 0) as epf,
        COALESCE(ss.esi, e.esi_deduction, 0) as esi
      FROM Employees e
      LEFT JOIN salary_structure_new ss ON e.EmpId = ss.empId
      LEFT JOIN salary_structure s_old ON e.EmpId = s_old.EmpId
      WHERE COALESCE(e.IsActive, 1) = 1
        AND (e.JoinDate IS NULL OR e.JoinDate <= ?)
    `;
    const params = [lastDay];
    if (tenantId) {
      empQuery += ` AND (e.Tenent_Id = ? OR e.Tenent_Id IS NULL)`;
      params.push(tenantId);
    }
    empQuery += ` ORDER BY e.id DESC`;

    const [employees] = await db.query(empQuery, params);

    if (!employees || employees.length === 0) {
      response.message = 'No active employees found.';
      return res.json(response);
    }

    // 3. Fetch actual attendance counts for this month & year
    const attendanceMap = {};
    try {
      const [attRows] = await db.query(
        `SELECT EmpId, COUNT(DISTINCT att_date) as presentCount FROM (
           SELECT EmpId, Date as att_date FROM Attendance 
           WHERE MONTH(Date) = ? AND YEAR(Date) = ? AND (Status IS NULL OR LOWER(Status) != 'absent')
           UNION
           SELECT EmpId, DateTime as att_date FROM Attendance 
           WHERE MONTH(DateTime) = ? AND YEAR(DateTime) = ? AND (Status IS NULL OR LOWER(Status) != 'absent')
         ) as combined
         WHERE att_date IS NOT NULL
         GROUP BY EmpId`,
        [month, year, month, year]
      );
      for (const row of attRows) {
        attendanceMap[row.EmpId] = parseInt(row.presentCount, 10) || 0;
      }
    } catch (_) {}

    // 4. Fetch approved casual leaves for this month
    const leavesMap = {};
    try {
      const [leaveRows] = await db.query(
        `SELECT EmpId, SUM(
           DATEDIFF(LEAST(?, EndDate), GREATEST(?, StartDate)) + 1
         ) AS leaveDays
         FROM Leaves
         WHERE category = 'CL' AND Status = 'Approved'
           AND StartDate <= ? AND EndDate >= ?
         GROUP BY EmpId`,
        [lastDay, firstDay, lastDay, firstDay]
      );
      for (const row of leaveRows) {
        leavesMap[row.EmpId] = parseInt(row.leaveDays, 10) || 0;
      }
    } catch (_) {}

    // 5. Fetch approved advance requests for this month
    const advanceMap = {};
    try {
      const [advRows] = await db.query(
        `SELECT EmpId, SUM(amount) AS totalAdvance 
         FROM advance_requests 
         WHERE deduction_month = ? AND deduction_year = ? AND status = 'Approved'
         GROUP BY EmpId`,
        [month, year]
      );
      for (const row of advRows) {
        advanceMap[row.EmpId] = parseFloat(row.totalAdvance) || 0;
      }
    } catch (_) {}

    // 6. Fetch approved employee expenses for this month
    const expenseMap = {};
    try {
      const [expRows] = await db.query(
        `SELECT empId, SUM(expenseAmount) AS totalExp 
         FROM ExpenseDetails 
         WHERE MONTH(expenseDate) = ? AND YEAR(expenseDate) = ? AND (LOWER(Status) = 'approved' OR LOWER(Status) = 'cleared')
         GROUP BY empId`,
        [month, year]
      );
      for (const row of expRows) {
        expenseMap[row.empId] = parseFloat(row.totalExp) || 0;
      }
      // Fallback check on Expenses table
      const [expRows2] = await db.query(
        `SELECT EmpId, SUM(Amount) AS totalExp 
         FROM Expenses 
         WHERE MONTH(BillDate) = ? AND YEAR(BillDate) = ? AND (LOWER(Status) = 'approved' OR LOWER(Status) = 'cleared')
         GROUP BY EmpId`,
        [month, year]
      );
      for (const row of expRows2) {
        if (!expenseMap[row.EmpId]) {
          expenseMap[row.EmpId] = parseFloat(row.totalExp) || 0;
        }
      }
    } catch (_) {}

    // 7. Calculate dynamic salary record for each employee
    const records = [];
    for (const emp of employees) {
      const empId = emp.EmpId;
      try {
        await ensureCasualLeaveAccrual(empId);
      } catch (_) {}

      // Attendance & Leaves
      const presentDays = attendanceMap[empId] || 0;
      const paidLeaveDays = leavesMap[empId] || 0;
      const totalWorkingDaysAttended = presentDays + paidLeaveDays;

      // Weekly Off Calculation for employee
      // "employee add pe weekoff add ho rha hai and employee ke weekoff pe basic salary ni cut hogi bt day allowance hogi dA only working days ke liye hai"
      const weekOffName = emp.WeekOff || 'Sunday';
      const totalWeeklyOffs = calculateWeeklyOffs(year, month, weekOffName);
      const totalWorkingDaysInMonth = Math.max(1, daysInMonth - totalWeeklyOffs);

      // Handle employee joining during this month
      let eligibleWeeklyOffs = totalWeeklyOffs;
      let eligibleWorkingDays = totalWorkingDaysInMonth;
      if (emp.JoinDate) {
        const jd = new Date(emp.JoinDate);
        if (jd.getFullYear() === year && (jd.getMonth() + 1) === month) {
          const startDay = jd.getDate();
          eligibleWeeklyOffs = 0;
          const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          const cleanName = String(weekOffName).toLowerCase().trim();
          const targetDay = daysOfWeek.indexOf(cleanName) !== -1 ? daysOfWeek.indexOf(cleanName) : 0;
          for (let d = startDay; d <= daysInMonth; d++) {
            const dt = new Date(year, month - 1, d);
            if (dt.getDay() === targetDay) eligibleWeeklyOffs++;
          }
          const totalCalendarDays = daysInMonth - startDay + 1;
          eligibleWorkingDays = Math.max(1, totalCalendarDays - eligibleWeeklyOffs);
        }
      }

      // Basic Payable Days: Weekoffs are NOT cut if employee attended work
      let basicPayableDays = 0;
      if (totalWorkingDaysAttended > 0) {
        basicPayableDays = Math.min(daysInMonth, totalWorkingDaysAttended + eligibleWeeklyOffs);
      }
      const basicDayRatio = daysInMonth > 0 ? (basicPayableDays / daysInMonth) : 0;

      // 1. Defined Monthly Salary Structure
      let definedBasic = parseFloat(emp.basic_salary) || 0;
      let definedDa = parseFloat(emp.da) || 0;
      let definedHra = parseFloat(emp.hra) || 0;
      let definedConv = parseFloat(emp.conveyance) || 0;
      let definedSpecial = parseFloat(emp.special_allowance) || 0;
      let definedGross = parseFloat(emp.ss_gross) || Math.round(definedBasic + definedDa + definedHra + definedConv + definedSpecial);

      if (definedGross === 0) {
        // Fallback default defined package for staff without explicit salary structure
        definedBasic = 20000;
        definedHra = Math.round(definedBasic * 0.25);
        definedConv = 1600;
        definedSpecial = Math.round(definedBasic * 0.1);
        definedGross = definedBasic + definedHra + definedConv + definedSpecial;
      }

      // 2. Actual Earnings:
      // Basic, HRA, Conv, Special allowance: payable on basicPayableDays (weekoff NOT cut)
      const actualBasic = Math.round(definedBasic * basicDayRatio);
      const actualHra = Math.round(definedHra * basicDayRatio);
      const actualConv = Math.round(definedConv * basicDayRatio);
      const actualSpecial = Math.round(definedSpecial * basicDayRatio);

      // DA (Day Allowance): "bt day allowance hogi dA only working days ke liye hai"
      // DA is earned strictly on actual working days (presentDays), NOT on weekoffs:
      let actualDa = 0;
      if (definedDa > 0 && presentDays > 0) {
        const daPerWorkingDay = eligibleWorkingDays > 0 ? (definedDa / eligibleWorkingDays) : (definedDa / daysInMonth);
        actualDa = Math.min(Math.round(definedDa), Math.round(daPerWorkingDay * presentDays));
      }

      const totalEarning = actualBasic + actualDa + actualHra + actualConv + actualSpecial;

      // 3. Deductions (pro-rated PF, ESI and approved advance)
      const epfRate = parseFloat(emp.epf) || Math.round(Math.min(definedBasic, 15000) * 0.12);
      const esiRate = parseFloat(emp.esi) || (definedGross <= 21000 ? Math.round(definedGross * 0.0075) : 0);
      const actualPf = Math.min(totalEarning, Math.round(epfRate * basicDayRatio));
      const actualEsi = Math.min(totalEarning, Math.round(esiRate * basicDayRatio));
      const advanceDeduction = advanceMap[empId] || 0;
      const totalDeductions = Math.min(totalEarning, actualPf + actualEsi + Math.round(advanceDeduction));

      // 4. Employee approved expenses (Reimbursement)
      const approvedExpense = expenseMap[empId] || 0;
      const reimbursement = Math.round(approvedExpense);

      // 5. Net Take Home
      const netSalary = Math.max(0, totalEarning - totalDeductions + reimbursement);

      records.push({
        id: emp.id,
        EmpId: emp.EmpId,
        Name: emp.Name,
        Department: emp.Department || 'Operations',
        Designation: emp.Designation || 'Staff',
        Month: month,
        Year: year,
        TotalDays: daysInMonth,
        TotalWorkingDays: totalWorkingDaysAttended, // Shows actual attendance days
        PresentDays: presentDays,
        LeaveDays: paidLeaveDays,
        WeekOffDays: eligibleWeeklyOffs,
        PaidDays: basicPayableDays,
        TotalGrossSalary: definedGross, // Defined total monthly package (Basic + HRA + DA + Conv. + Special)
        GrossSalary: definedGross,      // Defined gross package alias
        TotalEarning: totalEarning,     // Actual earnings as per attendance, weekoffs & DA rules
        TotalDeductions: totalDeductions, // Deductions (PF, ESI, Advance)
        Expense: reimbursement,
        Reimbursement: reimbursement,
        NetSalary: netSalary,
        Status: totalWorkingDaysAttended > 0 ? 'Paid' : 'Pending',
      });
    }

    response.success = true;
    response.data = records;
    response.message = 'Salary records fetched successfully.';
    return res.json(response);
  } catch (err) {
    console.error('Error in getSalaryRecords:', err);
    response.message = `Database Error: ${err.message}`;
    return res.status(500).json(response);
  }
};

module.exports = getSalaryRecords;