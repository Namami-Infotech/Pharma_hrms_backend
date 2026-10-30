const db = require('../../config/db');
const { getDayDiffInclusive } = require('./leaveHelper');

const approveLeave = async (req, res) => {
  const response = { success: false, message: '' };
  const data = req.body || {};

  const leaveId = data.id || data.Id || data.leaveId || data.LeaveId || req.query.id || req.query.Id || req.query.leaveId || req.query.LeaveId || '';
  const status = data.status || data.Status || req.query.status || req.query.Status || '';
  const userEmpId = data.userEmpId || data.empId || req.query.userEmpId || req.query.empId || '';
  const userRole = data.role || req.query.role || '';
  const isAdmin = ['Admin', 'admin', 'SuperAdmin'].includes(userRole);

  if (!leaveId || !status) {
    response.message = 'Please provide leaveId and status.';
    return res.json(response);
  }

  const conn = await db.getConnection();
  try {
    const [rows] = await conn.query('SELECT * FROM Leaves WHERE id = ?', [leaveId]);

    if (!rows || rows.length === 0) {
      conn.release();
      response.message = 'Leave request not found.';
      return res.json(response);
    }

    const leaveData = rows[0];
    const empid = leaveData.EmpId || leaveData.empid;

    // Reporting Managers cannot approve or reject their own leave requests
    if (!isAdmin && userEmpId && String(empid).trim().toLowerCase() === String(userEmpId).trim().toLowerCase()) {
      conn.release();
      response.message = 'Reporting managers cannot approve or reject their own leave requests. It must be approved by Admin.';
      return res.json(response);
    }

    const category = leaveData.category || leaveData.Category || leaveData.LeaveType;
    const startDate = leaveData.StartDate || leaveData.startDate;
    const endDate = leaveData.EndDate || leaveData.endDate;
    const days = leaveData.TotalDays || getDayDiffInclusive(startDate, endDate);

    await conn.beginTransaction();

    await conn.execute('UPDATE Leaves SET Status = ?, ApprovedDate = NOW() WHERE id = ?', [status, leaveId]);

    if (status === 'Rejected') {
      if (category !== 'LWP' && category !== 'HalfDay') {
        const validCategories = ['EL', 'SL', 'CompOff', 'BL', 'PL', 'CL'];
        if (!validCategories.includes(category)) {
          await conn.rollback();
          response.message = 'Invalid leave category.';
          return res.json(response);
        }

        await conn.execute(
          `UPDATE EmployeeLeave SET \`${category}\` = \`${category}\` + ? WHERE EmpId = ?`,
          [days, empid]
        );

        await conn.commit();
        response.success = true;
        response.message = 'Leave rejected and leave count updated successfully.';
        return res.json(response);
      } else {
        await conn.commit();
        response.success = true;
        response.message = 'LWP leave rejected successfully, no balance update needed.';
        return res.json(response);
      }
    } else {
      await conn.commit();
      response.success = true;
      response.message = 'Leave status updated successfully.';
      return res.json(response);
    }
  } catch (err) {
    await conn.rollback();
    console.error('Error in approveLeave:', err);
    response.message = `An error occurred: ${err.message}`;
    return res.status(500).json(response);
  } finally {
    conn.release();
  }
};

// 5. Add Comp Off (src/leave/add_comp_off.php);

module.exports = approveLeave;
