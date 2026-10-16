const db = require('../../config/db');
const { getDayDiffInclusive } = require('./leaveHelper');

const addPL = async (req, res) => {
  const response = { success: false, message: '' };

  try {
    const currentYear = new Date().getFullYear();

    const [employees] = await db.query(
      'SELECT EmpId, JoinDate FROM Employees WHERE IsActive = 1'
    );

    for (const employee of employees) {
      const empid = employee.EmpId;
      const joinDate = new Date(employee.JoinDate);
      const now = new Date();

      const monthDiff =
        (now.getFullYear() - joinDate.getFullYear()) * 12 +
        (now.getMonth() - joinDate.getMonth());

      if (monthDiff >= 2) {
        const [plRows] = await db.query(
          'SELECT COUNT(*) AS plCount FROM Leaves WHERE empid = ? AND YEAR(StartDate) = ? AND category = "PL"',
          [empid, currentYear]
        );
        const plCount = plRows[0].plCount;

        const [balRows] = await db.query(
          'SELECT PL FROM EmployeeLeave WHERE empid = ?',
          [empid]
        );
        const currentPLBalance = balRows.length > 0 ? balRows[0].PL : 0;

        if (plCount < 3) {
          const plToAdd = 3 - plCount;
          if (currentPLBalance >= plToAdd) {
            await db.execute(
              'UPDATE EmployeeLeave SET PL = PL - ? WHERE empid = ?',
              [plToAdd, empid]
            );
            response.success = true;
            response.message = `PL leave updated for employee: ${empid}`;
          }
        }
      }
    }

    if (!response.message) {
      response.message = 'PL processing completed.';
    }

    return res.json(response);
  } catch (err) {
    console.error('Error in addPL:', err);
    response.message = `An error occurred: ${err.message}`;
    return res.status(500).json(response);
  }
};

module.exports = addPL;
