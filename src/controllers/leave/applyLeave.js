const db = require('../../config/db');
const { getDayDiffInclusive, ensureCasualLeaveAccrual } = require('./leaveHelper');

const applyLeave = async (req, res) => {
  const response = { success: false, message: '' };
  const data = req.body || {};

  const empid = data.empid || data.EmpId || data.empId || data.emp_id || '';
  const startDate = data.startDate || '';
  const endDate = data.endDate || '';
  const reason = data.reason || '';
  const category = data.category || '';
  let status = data.status || 'Pending';

  if (!empid || !startDate || !endDate || !reason || !category) {
    response.message = 'Please provide empid, startDate, endDate, reason, and category.';
    return res.json(response);
  }

  try {
    const days = getDayDiffInclusive(startDate, endDate);

    if (!['CL', 'LWP'].includes(category)) {
      response.message = 'Only Casual Leave (CL) and Leave Without Pay (LWP) are available.';
      return res.json(response);
    }

    const tenantId = data.Tenent_Id || data.tenent_id || 1;

    if (category === 'LWP') {
      const insertSql = `
        INSERT INTO Leaves (EmpId, LeaveType, StartDate, EndDate, TotalDays, Reason, Status, category, Tenent_Id) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      await db.execute(insertSql, [empid, category, startDate, endDate, days, reason, status, category, tenantId]);

      response.success = true;
      response.message = 'Leave Without Pay applied successfully.';
      return res.json(response);
    }

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      await ensureCasualLeaveAccrual(empid);

      // Check balance
      let [rows] = await conn.query(
        `SELECT \`${category}\` as balance FROM EmployeeLeave WHERE EmpId = ?`,
        [empid]
      );

      if (!rows || rows.length === 0) {
        await conn.execute(
          'INSERT INTO EmployeeLeave (EmpId, CL, Tenent_Id) VALUES (?, 0, ?)',
          [empid, tenantId]
        );
        [rows] = await conn.query(
          `SELECT \`${category}\` as balance FROM EmployeeLeave WHERE EmpId = ?`,
          [empid]
        );
      }

      if (!rows || rows.length === 0) {
        conn.release();
        response.message = 'Employee not found in leave balance records.';
        return res.json(response);
      }

      const availableBalance = parseFloat(rows[0].balance || 0);

      if (days > availableBalance) {
        conn.release();
        response.message = `Insufficient leave balance. Available ${category}: ${availableBalance} days, Requested: ${days} days.`;
        response.insufficientBalance = true;
        return res.json(response);
      }

      // Insert leave application
      const insertSql = `
        INSERT INTO Leaves (EmpId, LeaveType, StartDate, EndDate, TotalDays, Reason, Status, category, Tenent_Id) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      await conn.execute(insertSql, [empid, category, startDate, endDate, days, reason, status, category, tenantId]);

      // Deduct balance
      await conn.execute(
        `UPDATE EmployeeLeave SET \`${category}\` = \`${category}\` - ? WHERE EmpId = ?`,
        [days, empid]
      );

      await conn.commit();

      response.success = true;
      response.message = 'Casual leave applied and leave count updated successfully.';
      response.status = status;

      return res.json(response);
    } catch (txErr) {
      await conn.rollback();
      throw txErr;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('Error in applyLeave:', err);
    response.message = `An error occurred: ${err.message}`;
    return res.status(500).json(response);
  }
};

// 2. Balance Leave (src/leave/balance_leave.php);

module.exports = applyLeave;
