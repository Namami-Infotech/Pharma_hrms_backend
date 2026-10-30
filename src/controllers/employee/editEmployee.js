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
      'Grade', 'UAN', 'ESI', 'ProbationPeriod',
      'FatherName', 'PanNumber', 'AadharNumber',
      'basic_salary', 'da', 'hra', 'conveyance', 'special_allowance',
      'pf_deduction', 'esi_deduction', 'tds', 'advance', 'lwf',
      'performance_bonus', 'gwr_inc'
    ];

    const fields = [];
    const params = [];

    for (const field of updatableFields) {
      if (data[field] !== undefined) {
        let val = data[field];
        if ((field === 'DOB' || field === 'JoinDate') && (!val || val.toString().trim() === '')) {
          val = null;
        }
        fields.push(`${field} = ?`);
        params.push(val);
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

    // Sync salary_structure_new if salary data is provided
    if (data.basic_salary !== undefined || data.da !== undefined || data.hra !== undefined) {
      try {
        const basic = parseFloat(data.basic_salary || 0);
        const da = parseFloat(data.da || 0);
        const hra = parseFloat(data.hra || 0);
        const conveyance = parseFloat(data.conveyance || 0);
        const specialAllowance = parseFloat(data.special_allowance || 0);
        const pf = parseFloat(data.pf_deduction || data.epf || 0);
        const esi = parseFloat(data.esi_deduction || 0);
        const grossSalary = basic + da + hra + conveyance + specialAllowance;
        const netTakeHome = grossSalary - (pf + esi + parseFloat(data.tds || 0) + parseFloat(data.advance || 0) + parseFloat(data.lwf || 0));

        await conn.execute(
          `INSERT INTO salary_structure_new (
            empId, emp_name, designation, department, grade,
            basic_salary, basic_salary_per_annum, hra, hra_per_annum,
            conveyance, conveyance_per_annum, special_allowance, special_allowance_per_annum,
            gross_salary, gross_salary_per_annum, epf, epf_per_annum,
            esi, esi_per_annum, total_benefits, total_benefits_per_annum,
            total_cost_of_company, net_take_home, Tenent_Id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            basic_salary = VALUES(basic_salary),
            hra = VALUES(hra),
            conveyance = VALUES(conveyance),
            special_allowance = VALUES(special_allowance),
            gross_salary = VALUES(gross_salary),
            epf = VALUES(epf),
            esi = VALUES(esi),
            net_take_home = VALUES(net_take_home)`,
          [
            EmpId, data.Name || '', data.Designation || '', data.Role || '', data.Grade || 'A',
            basic + da, (basic + da) * 12, hra, hra * 12,
            conveyance, conveyance * 12, specialAllowance, specialAllowance * 12,
            grossSalary, grossSalary * 12, pf, pf * 12,
            esi, esi * 12, 0, 0,
            grossSalary, netTakeHome, data.Tenent_Id || 1
          ]
        );
      } catch (_) {}
    }

    // Update leave balances
    const leaveData = {
      SL: data.SL !== undefined ? parseFloat(data.SL) : 1,
      EL: data.EL !== undefined ? parseFloat(data.EL) : 0,
      CL: data.CL !== undefined ? parseFloat(data.CL) : 0,
      PL: data.PL !== undefined ? parseFloat(data.PL) : 0,
    };

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
        'INSERT INTO EmployeeLeave (EmpId, SL, EL, Tenent_Id) VALUES (?, ?, ?, ?)',
        [EmpId, leaveData.SL, leaveData.EL, data.Tenent_Id || 1]
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
