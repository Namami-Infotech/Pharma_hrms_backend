const db = require('../../config/db');
const { getDayDiffInclusive } = require('./leaveHelper');

const getBalanceLeave = async (req, res) => {
  const response = { success: false, message: '', data: [] };
  const empid = req.query.empid || req.query.EmpId || req.query.empId || req.query.emp_id || req.body?.empid || req.body?.EmpId || req.body?.empId || req.body?.emp_id || '';

  if (!empid) {
    response.message = 'Please provide empid.';
    return res.json(response);
  }

  try {
    const [rows] = await db.query('SELECT * FROM EmployeeLeave WHERE EmpId = ? ORDER BY id DESC', [empid]);

    let leaveRow = rows && rows.length > 0 ? rows[0] : null;

    if (!leaveRow) {
      // Auto-initialize leave record for this employee if none exists
      await db.execute(
        'INSERT INTO EmployeeLeave (EmpId, SL, EL, CompOff, BL, PL, CL, Tenent_Id) VALUES (?, 1, 0, 0, 0, 0, 0, 1)',
        [empid]
      );
      const [newRows] = await db.query('SELECT * FROM EmployeeLeave WHERE EmpId = ? ORDER BY id DESC', [empid]);
      leaveRow = newRows && newRows.length > 0 ? newRows[0] : null;
    }

    if (leaveRow) {
      const data = { ...leaveRow };
      data.HalfDay = 1;

      response.TotalLeave = data.TotalLeave ?? data.totalLeave ?? 0;
      response.BalanceLeave = data.BalanceLeave ?? data.balanceLeave ?? 0;
      response.Tenent_Id = data.Tenent_Id ?? data.tenent_id ?? null;
      response.FinancialYear = data.FinancialYear ?? data.financialYear ?? null;

      delete data.id;
      delete data.EmpId;
      delete data.empid;
      delete data.LeaveType;
      delete data.leaveType;
      delete data.CompOffDates;
      delete data.compoffdates;
      delete data.TotalLeave;
      delete data.totalLeave;
      delete data.BalanceLeave;
      delete data.balanceLeave;
      delete data.Tenent_Id;
      delete data.tenent_id;
      delete data.FinancialYear;
      delete data.financialYear;

      response.success = true;
      response.data = data;
    } else {
      response.message = 'No leave data found for the given empid.';
    }

    return res.json(response);
  } catch (err) {
    console.error('Error in getBalanceLeave:', err);
    response.message = `An error occurred: ${err.message}`;
    return res.status(500).json(response);
  }
};

// 3. Get Leaves (src/leave/get_leave.php);

module.exports = getBalanceLeave;
