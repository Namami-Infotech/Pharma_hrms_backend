const db = require('../../config/db');
const { hashPassword } = require('./employeeHelper');

const editEmployee = async (req, res) => {
  const response = { success: false, message: '' };
  const data = req.body || {};

  const EmpId = (data.EmpId || '').toString().trim();
  const Shift = (data.Shift || '').toString().trim();
  const offices = data.Offices || [];
  const leaveData = data.LeaveData || { SL: 1, EL: 0.0 };

  if (!EmpId || !Shift) {
    response.message = 'EmpId and Shift are required.';
    return res.json(response);
  }

  const conn = await db.getConnection();
  try {
    const [existRows] = await conn.query(
      'SELECT COUNT(*) as count FROM Employees WHERE EmpId = ?',
      [EmpId]
    );

    if (existRows[0].count === 0) {
      conn.release();
      response.message = 'Employee ID does not exist.';
      return res.json(response);
    }

    await conn.beginTransaction();

    let officeIds = [];
    if (Array.isArray(offices) && offices.length > 0) {
      for (const office of offices) {
        const [offRows] = await conn.query(
          'SELECT Id FROM EmployeeOffice WHERE OfficeName = ? AND LatLong = ? LIMIT 1',
          [office.OfficeName, office.LatLong]
        );
        if (!offRows || offRows.length === 0) {
          throw new Error(`Office not found: ${office.OfficeName}`);
        }
        officeIds.push(offRows[0].Id);
      }
    }

    const updatableFields = [
      'Name', 'Mobile', 'EmailId', 'Role', 'OTP', 'IsOTPExpired',
      'IsGeofence', 'Tenent_Id', 'IsActive', 'RM', 'Shift',
      'ResetTime', 'DOB', 'JoinDate', 'WeekOff', 'Designation',
      'Grade', 'UAN', 'ESI', 'ProbationPeriod'
    ];

    const fields = [];
    const params = [];

    for (const field of updatableFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`);
        params.push(data[field]);
      }
    }

    if (data.Password) {
      fields.push('Password = ?');
      params.push(hashPassword(data.Password));
    }

    if (officeIds.length > 0) {
      fields.push('OfficeId = ?');
      params.push(officeIds[0]);
    }

    if (fields.length > 0) {
      params.push(EmpId);
      await conn.execute(
        `UPDATE Employees SET ${fields.join(', ')} WHERE EmpId = ?`,
        params
      );
    }

    // Update leave balances
    const [leaveCheck] = await conn.query(
      'SELECT COUNT(*) as count FROM EmployeeLeave WHERE EmpId = ?',
      [EmpId]
    );

    if (leaveCheck[0].count > 0) {
      await conn.execute(
        'UPDATE EmployeeLeave SET SL = ?, EL = ? WHERE EmpId = ?',
        [leaveData.SL, leaveData.EL, EmpId]
      );
    } else {
      await conn.execute(
        'INSERT INTO EmployeeLeave (EmpId, SL, EL) VALUES (?, ?, ?)',
        [EmpId, leaveData.SL, leaveData.EL]
      );
    }

    await conn.commit();
    response.success = true;
    response.message = 'Employee updated successfully.';
    return res.json(response);
  } catch (err) {
    await conn.rollback();
    console.error('Error in editEmployee:', err);
    response.message = err.message;
    return res.json(response);
  } finally {
    conn.release();
  }
};

// 3. List Employees (src/employee/list_employee.php);

module.exports = editEmployee;
