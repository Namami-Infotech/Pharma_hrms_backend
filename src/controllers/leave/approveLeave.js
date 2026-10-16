const db = require('../../config/db');
const { getDayDiffInclusive } = require('./leaveHelper');

const approveLeave = async (req, res) => {
  const response = { success: false, message: '' };
  const data = req.body || {};

  const leaveId = data.id || '';
  const status = data.status || '';

  if (!leaveId || !status) {
    response.message = 'Please provide leaveId and status.';
    return res.json(response);
  }

  const conn = await db.getConnection();
  try {
    const [rows] = await conn.query('SELECT empid, startDate, endDate, category FROM Leaves WHERE id = ?', [leaveId]);

    if (!rows || rows.length === 0) {
      conn.release();
      response.message = 'Leave request not found.';
      return res.json(response);
    }

    const leaveData = rows[0];
    const empid = leaveData.empid;
    const category = leaveData.category;
    const days = getDayDiffInclusive(leaveData.startDate, leaveData.endDate);

    await conn.beginTransaction();

    await conn.execute('UPDATE Leaves SET status = ? WHERE id = ?', [status, leaveId]);

    if (status === 'Rejected') {
      if (category !== 'LWP' && category !== 'HalfDay') {
        const validCategories = ['EL', 'SL', 'CompOff', 'BL', 'PL', 'CL'];
        if (!validCategories.includes(category)) {
          await conn.rollback();
          response.message = 'Invalid leave category.';
          return res.json(response);
        }

        await conn.execute(
          `UPDATE EmployeeLeave SET \`${category}\` = \`${category}\` + ? WHERE empid = ?`,
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
