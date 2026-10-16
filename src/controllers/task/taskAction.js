const db = require('../../config/db');

const taskAction = async (req, res) => {
  const input = req.body || {};
  const type = (input.type || input.category || '').toLowerCase().trim();

  try {
    switch (type) {
      case 'leave':
      case 'leaves': {
        const id = input.id;
        const status = input.status;

        if (!id || !status) {
          throw new Error('Missing id or status.');
        }

        const [leaveRows] = await db.query(
          'SELECT empid, startDate, endDate, category FROM Leaves WHERE id = ?',
          [id]
        );

        if (!leaveRows || leaveRows.length === 0) {
          throw new Error('Leave request not found.');
        }

        const leave = leaveRows[0];
        const start = new Date(leave.startDate);
        const end = new Date(leave.endDate);
        const days = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;

        await db.execute('UPDATE Leaves SET status = ? WHERE id = ?', [status, id]);

        if (status === 'Rejected' && leave.category !== 'LWP' && leave.category !== 'HalfDay') {
          const map = {
            EL: 'EL',
            SL: 'SL',
            CL: 'CL',
            PL: 'PL',
            BL: 'BL',
            CompOff: 'CompOff'
          };

          const field = map[leave.category];
          if (!field) {
            throw new Error('Invalid leave category.');
          }

          await db.execute(
            `UPDATE EmployeeLeave SET \`${field}\` = \`${field}\` + ? WHERE empid = ?`,
            [days, leave.empid]
          );
        }

        return res.json({
          success: true,
          message: 'Leave updated successfully.'
        });
      }

      case 'regularisation': {
        const id = input.id;
        const status = input.status;

        if (!id || !status) {
          throw new Error('Missing id or status.');
        }

        const [regRows] = await db.query(
          'SELECT RegID, InActivityId, OutActivityId, InTime, OutTime, Date FROM Regularisation WHERE RegID = ?',
          [id]
        );

        if (!regRows || regRows.length === 0) {
          throw new Error('Regularisation record not found.');
        }

        const reg = regRows[0];

        const conn = await db.getConnection();
        try {
          await conn.beginTransaction();

          const newInTime = reg.InTime ? `${reg.Date} ${reg.InTime}` : null;
          const newOutTime = reg.OutTime ? `${reg.Date} ${reg.OutTime}` : null;

          for (const key of ['InActivityId', 'OutActivityId']) {
            if (reg[key] && reg[key] !== 'N/A') {
              await conn.execute(
                'UPDATE Attendance SET RegulariseStatus = 0 WHERE Id = ?',
                [reg[key]]
              );
            }
          }

          if (status === 'Approved') {
            if (reg.InActivityId && reg.InActivityId !== 'N/A' && newInTime) {
              await conn.execute(
                'UPDATE Attendance SET InTime = ?, RegulariseStatus = 1 WHERE Id = ?',
                [newInTime, reg.InActivityId]
              );
            }

            if (reg.OutActivityId && reg.OutActivityId !== 'N/A' && newOutTime) {
              await conn.execute(
                'UPDATE Attendance SET OutTime = ?, RegulariseStatus = 1 WHERE Id = ?',
                [newOutTime, reg.OutActivityId]
              );
            }
          }

          await conn.execute(
            'UPDATE Regularisation SET Status = ?, UpdateDate = NOW() WHERE RegID = ?',
            [status, id]
          );

          await conn.commit();
          return res.json({
            success: true,
            message: 'Regularisation updated successfully.'
          });
        } catch (err) {
          await conn.rollback();
          throw err;
        } finally {
          conn.release();
        }
      }

      case 'expensedetails': {
        await db.execute('UPDATE ExpenseDetails SET Status = ? WHERE detailId = ?', [
          input.status,
          input.id
        ]);
        return res.json({
          success: true,
          message: 'Expense updated successfully.'
        });
      }

      case 'travelexpenses': {
        await db.execute('UPDATE TravelExpenses SET status = ? WHERE id = ?', [
          input.status,
          input.id
        ]);
        return res.json({
          success: true,
          message: 'Travel expense updated successfully.'
        });
      }

      default:
        throw new Error('Invalid type.');
    }
  } catch (err) {
    console.error('Error in taskAction:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = taskAction;
