const db = require('../../config/db');
const { calculateWeeklyOffs } = require('./salaryHelper');
const { ensureCasualLeaveAccrual } = require('../leave/leaveHelper');

const MONTH_NAMES = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
];

const numberToWords = (num) => {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n) => {
    if ((n = n.toString()).length > 9) return 'overflow';
    const nArr = ('000000000' + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!nArr) return '';
    let str = '';
    str += (nArr[1] != 0) ? (a[Number(nArr[1])] || b[nArr[1][0]] + ' ' + a[nArr[1][1]]) + 'Crore ' : '';
    str += (nArr[2] != 0) ? (a[Number(nArr[2])] || b[nArr[2][0]] + ' ' + a[nArr[2][1]]) + 'Lakh ' : '';
    str += (nArr[3] != 0) ? (a[Number(nArr[3])] || b[nArr[3][0]] + ' ' + a[nArr[3][1]]) + 'Thousand ' : '';
    str += (nArr[4] != 0) ? (a[Number(nArr[4])] || b[nArr[4][0]] + ' ' + a[nArr[4][1]]) + 'Hundred ' : '';
    str += (nArr[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(nArr[5])] || b[nArr[5][0]] + ' ' + a[nArr[5][1]]) : '';
    return str.trim();
  };

  const val = Math.round(Number(num) || 0);
  if (val <= 0) return 'Zero Rupees Only';
  return (inWords(val) + ' Rupees Only');
};

const getSalarySlip = async (req, res) => {
  const response = { success: false, message: '', data: null };

  const query = req.query || {};
  const body = req.body || {};

  let rawMonth = (query.month || body.month || '').toString().trim();
  let year = parseInt(query.year || body.year || new Date().getFullYear(), 10);
  const empId = (query.empId || query.EmpId || body.empId || body.EmpId || '').toString().trim();

  if (!empId) {
    response.message = 'Please provide an Employee ID (empId).';
    return res.status(400).json(response);
  }

  // Parse Month
  let monthIndex = -1;
  if (!rawMonth) {
    monthIndex = new Date().getMonth();
  } else if (!isNaN(rawMonth)) {
    monthIndex = parseInt(rawMonth, 10) - 1;
  } else {
    monthIndex = MONTH_NAMES.findIndex(m => m.toLowerCase().startsWith(rawMonth.toLowerCase()));
    if (monthIndex === -1) monthIndex = new Date().getMonth();
  }

  const monthNumber = monthIndex + 1;
  const monthName = MONTH_NAMES[monthIndex] || 'MAY';
  const daysInMonth = new Date(year, monthNumber, 0).getDate();

  // 1. Month restriction: only previous completed months
  // "in salary slip and salary details will come only for previous month from current month"
  const now = new Date();
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const maxAllowedYear = prevDate.getFullYear();
  const maxAllowedMonth = prevDate.getMonth() + 1;
  if (year > maxAllowedYear || (year === maxAllowedYear && monthNumber > maxAllowedMonth)) {
    response.message = 'Salary slip can only be generated for completed months (up to previous month). Current and future months are not completed yet.';
    return res.status(400).json(response);
  }

  try {
    // 1. Fetch employee details from Employees table
    const [empRows] = await db.query(
      `SELECT e.*, eo.OfficeName, eo.OfficeAddress
       FROM Employees e
       LEFT JOIN EmployeeOffice eo ON (e.OfficeId = eo.id OR e.OfficeId = eo.OfficeId)
       WHERE e.EmpId = ?
       LIMIT 1`,
      [empId]
    );

    if (!empRows || empRows.length === 0) {
      response.message = `Employee with ID ${empId} not found.`;
      return res.status(404).json(response);
    }

    const emp = empRows[0];

    // 2. Joining date check: "joining month se pehle ka generate ni hoga"
    if (emp.JoinDate) {
      const jd = new Date(emp.JoinDate);
      const joinYear = jd.getFullYear();
      const joinMonth = jd.getMonth() + 1;
      if (year < joinYear || (year === joinYear && monthNumber < joinMonth)) {
        const dStr = String(jd.getDate()).padStart(2, '0');
        const mStr = String(joinMonth).padStart(2, '0');
        response.message = `Salary slip cannot be generated before employee's joining month (${MONTH_NAMES[joinMonth - 1]} ${joinYear}, Joined: ${dStr}-${mStr}-${joinYear}).`;
        return res.status(400).json(response);
      }
    }

    await ensureCasualLeaveAccrual(empId);

    // 2. Check if a pre-computed record exists in salary_records_new or defined structure in salary_structure_new
    let record = null;
    try {
      const [recRows] = await db.query(
        `SELECT * FROM salary_records_new 
         WHERE month = ? AND year = ? AND empId = ? 
         LIMIT 1`,
        [monthNumber, year, empId]
      );
      if (recRows && recRows.length > 0) record = recRows[0];
    } catch (_) { }

    let ssStruct = null;
    try {
      const [ssRows] = await db.query(
        `SELECT * FROM salary_structure_new WHERE empId = ? ORDER BY id DESC LIMIT 1`,
        [empId]
      );
      if (ssRows && ssRows.length > 0) ssStruct = ssRows[0];
    } catch (_) { }

    // 3. Fetch attendance marked days for that month and year
    // Query Attendance table directly (with lowercase/uppercase fallback)
    let attendanceDays = 0;
    try {
      const [attRows] = await db.query(
        `SELECT COUNT(DISTINCT att_date) as presentCount FROM (
           SELECT Date as att_date FROM Attendance 
           WHERE EmpId = ? AND MONTH(Date) = ? AND YEAR(Date) = ? AND (Status IS NULL OR LOWER(Status) != 'absent')
           UNION
           SELECT DateTime as att_date FROM Attendance 
           WHERE EmpId = ? AND MONTH(DateTime) = ? AND YEAR(DateTime) = ? AND (Status IS NULL OR LOWER(Status) != 'absent')
         ) as combined
         WHERE att_date IS NOT NULL`,
        [empId, monthNumber, year, empId, monthNumber, year]
      );
      if (attRows && attRows[0] && attRows[0].presentCount !== undefined) {
        attendanceDays = parseInt(attRows[0].presentCount, 10) || 0;
      }
    } catch (attErr) {
      // Fallback for Linux lowercase 'attendance' table
      try {
        const [attRowsLower] = await db.query(
          `SELECT COUNT(DISTINCT att_date) as presentCount FROM (
             SELECT Date as att_date FROM attendance 
             WHERE EmpId = ? AND MONTH(Date) = ? AND YEAR(Date) = ? AND (Status IS NULL OR LOWER(Status) != 'absent')
             UNION
             SELECT DateTime as att_date FROM attendance 
             WHERE EmpId = ? AND MONTH(DateTime) = ? AND YEAR(DateTime) = ? AND (Status IS NULL OR LOWER(Status) != 'absent')
           ) as combined
           WHERE att_date IS NOT NULL`,
          [empId, monthNumber, year, empId, monthNumber, year]
        );
        if (attRowsLower && attRowsLower[0] && attRowsLower[0].presentCount !== undefined) {
          attendanceDays = parseInt(attRowsLower[0].presentCount, 10) || 0;
        }
      } catch (err2) {
        console.error('Error fetching attendance days:', err2.message);
      }
    }

    let paidCasualLeaveDays = 0;
    try {
      const [leaveRows] = await db.query(
        `SELECT SUM(
           DATEDIFF(LEAST(?, EndDate), GREATEST(?, StartDate)) + 1
         ) AS leaveDays
         FROM Leaves
         WHERE EmpId = ? AND category = 'CL' AND Status = 'Approved'
           AND StartDate <= ? AND EndDate >= ?`,
        [`${year}-${String(monthNumber).padStart(2, '0')}-${daysInMonth}`, `${year}-${String(monthNumber).padStart(2, '0')}-01`, empId,
          `${year}-${String(monthNumber).padStart(2, '0')}-${daysInMonth}`, `${year}-${String(monthNumber).padStart(2, '0')}-01`]
      );
      paidCasualLeaveDays = parseInt(leaveRows[0]?.leaveDays, 10) || 0;
    } catch (leaveErr) {
      console.warn('Error fetching approved casual leave for salary slip:', leaveErr.message);
    }

    // 3. Week Off & Working Days Calculation
    // "employee add pe weekoff add ho rha hai and employee ke weekoff pe basic salary ni cut hogi bt day allowance hogi dA only working days ke liye hai"
    const weekOffName = emp.WeekOff || 'Sunday';
    const totalWeeklyOffs = calculateWeeklyOffs(year, monthNumber, weekOffName);
    const totalWorkingDaysInMonth = Math.max(1, daysInMonth - totalWeeklyOffs);

    let eligibleWeeklyOffs = totalWeeklyOffs;
    let eligibleWorkingDays = totalWorkingDaysInMonth;
    if (emp.JoinDate) {
      const jd = new Date(emp.JoinDate);
      if (jd.getFullYear() === year && (jd.getMonth() + 1) === monthNumber) {
        const startDay = jd.getDate();
        eligibleWeeklyOffs = 0;
        const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const cleanName = String(weekOffName).toLowerCase().trim();
        const targetDay = daysOfWeek.indexOf(cleanName) !== -1 ? daysOfWeek.indexOf(cleanName) : 0;
        for (let d = startDay; d <= daysInMonth; d++) {
          const dt = new Date(year, monthNumber - 1, d);
          if (dt.getDay() === targetDay) eligibleWeeklyOffs++;
        }
        const totalCalendarDays = daysInMonth - startDay + 1;
        eligibleWorkingDays = Math.max(1, totalCalendarDays - eligibleWeeklyOffs);
      }
    }

    const totalWorkingDaysAttended = attendanceDays + paidCasualLeaveDays;

    // Basic Payable Days: Weekoffs are NOT cut if employee attended work
    let basicPayableDays = 0;
    if (totalWorkingDaysAttended > 0) {
      basicPayableDays = Math.min(daysInMonth, totalWorkingDaysAttended + eligibleWeeklyOffs);
    }

    // Allow explicit override if provided by client (e.g., ?days=... or ?payableDays=...)
    const explicitDays = query.days ?? query.payableDays ?? body.days ?? body.payableDays;
    if (explicitDays !== undefined && explicitDays !== null && explicitDays !== '') {
      const parsed = parseInt(explicitDays, 10);
      if (!isNaN(parsed) && parsed >= 0) {
        basicPayableDays = Math.min(parsed, daysInMonth);
      }
    }

    // Calculate rates (Monthly Master Rates)
    const basic = parseFloat(ssStruct?.basic_salary) || parseFloat(emp.basic_salary) || (record ? parseFloat(record.basic_salary) : 0);
    const da = parseFloat(ssStruct?.da) || parseFloat(emp.da) || 0;
    const basicAndDa = basic + da;
    const hra = parseFloat(ssStruct?.hra) || parseFloat(emp.hra) || (record ? parseFloat(record.hra) : 0);
    const conv = parseFloat(ssStruct?.conveyance) || parseFloat(emp.conveyance) || (record ? parseFloat(record.conveyance) : 0);
    const specialAllow = parseFloat(ssStruct?.special_allowance) || parseFloat(emp.special_allowance) || (record ? parseFloat(record.special_allowance) : 0);
    const gwrInc = parseFloat(emp.gwr_inc) || 0;
    const performanceBonus = parseFloat(emp.performance_bonus) || 0;

    const rateTotal = Math.round(basicAndDa + hra + conv + specialAllow);

    // Earnings:
    // Basic, HRA, Conv, Special: calculated on basicPayableDays (weekoffs are NOT cut)
    const basicDayRatio = daysInMonth > 0 ? (basicPayableDays / daysInMonth) : 0;

    const actualBasic = Math.round(basic * basicDayRatio);
    const actualHra = Math.round(hra * basicDayRatio);
    const actualConv = Math.round(conv * basicDayRatio);
    const actualSpecialAllow = Math.round(specialAllow * basicDayRatio);
    const actualGwrInc = Math.round(gwrInc * basicDayRatio);
    const actualPerformanceBonus = Math.round(performanceBonus * basicDayRatio);

    // DA (Day Allowance): "bt day allowance hogi dA only working days ke liye hai"
    // DA is earned strictly on actual working days (attendanceDays), NOT on weekoffs:
    let actualDa = 0;
    if (da > 0 && attendanceDays > 0) {
      const daPerDay = eligibleWorkingDays > 0 ? (da / eligibleWorkingDays) : (da / daysInMonth);
      actualDa = Math.min(Math.round(da), Math.round(daPerDay * attendanceDays));
    }

    const actualEarningsTotal = actualBasic + actualDa + actualHra + actualConv + actualSpecialAllow + actualGwrInc + actualPerformanceBonus;
    const grossPay = actualEarningsTotal;

    // Query approved advance payments for this employee for this specific month & year
    let approvedAdvance = 0;
    try {
      const [advRows] = await db.query(
        `SELECT SUM(amount) AS totalAdvance 
         FROM advance_requests 
         WHERE EmpId = ? AND deduction_month = ? AND deduction_year = ? AND status = 'Approved'`,
        [emp.EmpId, monthNumber, year]
      );
      if (advRows && advRows.length > 0 && advRows[0].totalAdvance !== null) {
        approvedAdvance = parseFloat(advRows[0].totalAdvance) || 0;
      }
    } catch (advErr) {
      console.warn('Error fetching approved advance for salary slip:', advErr.message);
    }

    // Deductions (Pro-rated by days and capped at grossPay)
    const esi = parseFloat(ssStruct?.esi) || parseFloat(emp.esi_deduction) || (record ? parseFloat(record.esi) : 0);
    const pf = parseFloat(ssStruct?.epf) || parseFloat(emp.pf_deduction) || (record ? parseFloat(record.epf) : 0);
    const lwf = parseFloat(emp.lwf) || 0;
    const tds = parseFloat(emp.tds) || 0;
    const advance = approvedAdvance > 0 ? approvedAdvance : (parseFloat(emp.advance) || 0);

    const actualPf = Math.min(grossPay, Math.round(pf * basicDayRatio));
    const actualEsi = Math.min(grossPay, Math.round(esi * basicDayRatio));
    const actualLwf = Math.min(grossPay, Math.round(lwf * basicDayRatio));
    const actualTds = Math.min(grossPay, Math.round(tds * basicDayRatio));
    // When an advance payment is approved for this month, deduct the approved advance amount
    const actualAdvance = Math.min(grossPay, approvedAdvance > 0 ? Math.round(approvedAdvance) : Math.round(advance * basicDayRatio));

    const grossDed = Math.min(grossPay, actualPf + actualEsi + actualLwf + actualTds + actualAdvance);

    // Query approved expenses for this employee for this specific month & year
    let approvedExpense = 0;
    try {
      const [expRows] = await db.query(
        `SELECT SUM(expenseAmount) AS totalExp 
         FROM ExpenseDetails 
         WHERE empId = ? AND MONTH(expenseDate) = ? AND YEAR(expenseDate) = ? AND (LOWER(Status) = 'approved' OR LOWER(Status) = 'cleared')`,
        [emp.EmpId, monthNumber, year]
      );
      if (expRows && expRows.length > 0 && expRows[0].totalExp !== null) {
        approvedExpense = parseFloat(expRows[0].totalExp) || 0;
      }
      if (approvedExpense === 0) {
        const [expRows2] = await db.query(
          `SELECT SUM(Amount) AS totalExp 
           FROM Expenses 
           WHERE EmpId = ? AND MONTH(BillDate) = ? AND YEAR(BillDate) = ? AND (LOWER(Status) = 'approved' OR LOWER(Status) = 'cleared')`,
          [emp.EmpId, monthNumber, year]
        );
        if (expRows2 && expRows2.length > 0 && expRows2[0].totalExp !== null) {
          approvedExpense = parseFloat(expRows2[0].totalExp) || 0;
        }
      }
    } catch (expErr) {
      console.warn('Error fetching approved expenses for salary slip:', expErr.message);
    }

    const reimbursement = Math.round(approvedExpense);
    const netPay = Math.max(0, grossPay - grossDed + reimbursement);

    // Format Dates
    let dobFormatted = 'NA';
    if (emp.DOB) {
      try {
        const d = new Date(emp.DOB);
        if (!isNaN(d.getTime())) {
          dobFormatted = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getFullYear()).slice(-2)}`;
        }
      } catch (_) { }
    }

    let dojFormatted = 'NA';
    if (emp.JoinDate || emp.DateOfJoining) {
      try {
        const d = new Date(emp.JoinDate || emp.DateOfJoining);
        if (!isNaN(d.getTime())) {
          dojFormatted = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getFullYear()).slice(-2)}`;
        }
      } catch (_) { }
    }

    const payload = {
      // Company Details (matches Aberdure Pharma design)
      company: {
        name: 'M/S ABERDURE PHARMA',
        address: '1ST FLOOR, SHOP 28 PROP.NO 920-21 WARD NO 07 KH NO 1151/3, BISHAN SWAROOP COMPLEX, MEHRAULI MAIN MARKET, MEHRAULI, NEW DELHI, SOUTH DELHI, DELHI, 110030',
        title: `PAY SLIP FOR THE MONTH OF: ${monthName} ${year}`,
        month: monthName,
        year: year
      },

      // Employee Information Block
      employee: {
        empCode: emp.EmpId || 'AP0005',
        name: (emp.Name || '').toUpperCase(),
        fatherName: (emp.FatherName || 'RADHESHYAM MISHRA').toUpperCase(),
        designation: (emp.Designation || 'TERRITORY MANAGER').toUpperCase(),
        department: (emp.Department || emp.Role || 'NA').toUpperCase(),
        location: (emp.OfficeName || 'DELHI').toUpperCase(),
        esiNo: emp.ESI || 'NA',
        uanNo: emp.UAN || '102327824915',
        dob: dobFormatted,
        doj: dojFormatted,
        idNo: emp.PanNumber || emp.AadharNumber || 'A443049039234',
        payableDays: basicPayableDays,
        attendanceDays: attendanceDays,
        weekOffDays: eligibleWeeklyOffs,
        daysInMonth: daysInMonth
      },

      // 1. Rate Column (Monthly Master Rates)
      rate: {
        salary: Math.round(basic),
        da: Math.round(da),
        // Retained for clients that still consume the combined field.
        basicDa: Math.round(basicAndDa),
        hra: Math.round(hra),
        conv: Math.round(conv),
        specialAllow: Math.round(specialAllow),
        total: rateTotal
      },

      // 2. Actual Earning Column (Day-wise Multiplied)
      earnings: {
        basic: actualBasic,
        da: actualDa,
        hra: actualHra,
        conv: actualConv,
        specialAllow: actualSpecialAllow,
        gwrInc: actualGwrInc,
        performanceBonus: actualPerformanceBonus,
        total: actualEarningsTotal
      },

      // 3. Deductions Column
      deductions: {
        esi: actualEsi,
        pf: actualPf,
        lwf: actualLwf,
        tds: actualTds,
        advance: actualAdvance,
        total: grossDed
      },

      // 4. Total Column
      summary: {
        grossPay: grossPay,
        grossDed: grossDed,
        reimbursement: reimbursement,
        expense: reimbursement,
        netPay: netPay,
        netPayWords: numberToWords(netPay)
      },

      // Raw DB fields for compatibility with existing components
      EmpId: emp.EmpId,
      Name: emp.Name,
      Designation: emp.Designation,
      Month: monthNumber,
      Year: year,
      BasicSalary: basic,
      NetSalary: netPay
    };

    response.success = true;
    response.data = payload;
    response.message = 'Salary slip generated successfully.';

    return res.json(response);
  } catch (err) {
    console.error('Error in getSalarySlip:', err);
    response.message = `Database error: ${err.message}`;
    return res.status(500).json(response);
  }
};

module.exports = getSalarySlip;
