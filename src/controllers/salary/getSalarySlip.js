const db = require('../../config/db');

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

    // 2. Check if a pre-computed record exists in salary_records_new
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

    // Determine payableDays:
    // If client provided a custom override in query or body (e.g., ?days=... or ?payableDays=...), respect it;
    // Otherwise, use the actual marked attendance days from Attendance!
    let payableDays = attendanceDays;
    const explicitDays = query.days ?? query.payableDays ?? body.days ?? body.payableDays;
    if (explicitDays !== undefined && explicitDays !== null && explicitDays !== '') {
      const parsed = parseInt(explicitDays, 10);
      if (!isNaN(parsed) && parsed >= 0) {
        payableDays = Math.min(parsed, daysInMonth);
      }
    }

    // Calculate rates (Monthly Master Rates)
    const basic = parseFloat(emp.basic_salary) || (record ? parseFloat(record.basic_salary) : 0);
    const da = parseFloat(emp.da) || 0;
    const basicAndDa = basic + da;
    const hra = parseFloat(emp.hra) || (record ? parseFloat(record.hra) : 0);
    const conv = parseFloat(emp.conveyance) || (record ? parseFloat(record.conveyance) : 0);
    const specialAllow = parseFloat(emp.special_allowance) || (record ? parseFloat(record.special_allowance) : 0);
    const gwrInc = parseFloat(emp.gwr_inc) || 0;
    const performanceBonus = parseFloat(emp.performance_bonus) || 0;

    const rateTotal = Math.round(basicAndDa + hra + conv + specialAllow);

    // Day-wise Actual Earnings: (Monthly Component / daysInMonth) * payableDays
    const dayRatio = daysInMonth > 0 ? (payableDays / daysInMonth) : 0;

    const actualBasic = Math.round(basicAndDa * dayRatio);
    const actualHra = Math.round(hra * dayRatio);
    const actualConv = Math.round(conv * dayRatio);
    const actualSpecialAllow = Math.round(specialAllow * dayRatio);
    const actualGwrInc = Math.round(gwrInc * dayRatio);
    const actualPerformanceBonus = Math.round(performanceBonus * dayRatio);

    const actualEarningsTotal = actualBasic + actualHra + actualConv + actualSpecialAllow + actualGwrInc + actualPerformanceBonus;
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
    const esi = parseFloat(emp.esi_deduction) || (record ? parseFloat(record.esi) : 0);
    const pf = parseFloat(emp.pf_deduction) || (record ? parseFloat(record.epf) : 0);
    const lwf = parseFloat(emp.lwf) || 0;
    const tds = parseFloat(emp.tds) || 0;
    const advance = approvedAdvance > 0 ? approvedAdvance : (parseFloat(emp.advance) || 0);

    const actualPf = Math.min(grossPay, Math.round(pf * dayRatio));
    const actualEsi = Math.min(grossPay, Math.round(esi * dayRatio));
    const actualLwf = Math.min(grossPay, Math.round(lwf * dayRatio));
    const actualTds = Math.min(grossPay, Math.round(tds * dayRatio));
    // When an advance payment is approved for this month, deduct the approved advance amount
    const actualAdvance = Math.min(grossPay, approvedAdvance > 0 ? Math.round(approvedAdvance) : Math.round(advance * dayRatio));

    const grossDed = Math.min(grossPay, actualPf + actualEsi + actualLwf + actualTds + actualAdvance);
    const reimbursement = 0;
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
        payableDays: payableDays,
        attendanceDays: attendanceDays,
        daysInMonth: daysInMonth
      },

      // 1. Rate Column (Monthly Master Rates)
      rate: {
        basicDa: Math.round(basicAndDa),
        hra: Math.round(hra),
        conv: Math.round(conv),
        specialAllow: Math.round(specialAllow),
        total: rateTotal
      },

      // 2. Actual Earning Column (Day-wise Multiplied)
      earnings: {
        basic: actualBasic,
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
