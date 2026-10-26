const db = require('../../config/db');
const { hashPassword } = require('./employeeHelper');

const addEmployee = async (req, res) => {
  const response = { success: false, message: '' };
  const data = req.body || {};

  const EmpId = (data.EmpId || '').toString().trim();
  const Name = (data.Name || '').toString().trim();
  const Password = (data.Password || '').toString();
  const Shift = (data.Shift || '').toString().trim();
  const offices = data.Offices || data.offices || [];
  const Mobile = data.Mobile || '';
  const EmailId = data.EmailId || '';
  const Role = data.Role || '';
  const OTP = data.OTP || null;
  const IsOTPExpired = data.IsOTPExpired || 0;
  const IsGeofence = data.IsGeofence || 0;
  const Tenent_Id = data.Tenent_Id || 1;
  const IsActive = data.IsActive !== undefined ? data.IsActive : 1;
  const CreateDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const RM = data.RM || null;
  const ResetTime = data.ResetTime || '06:00:00';
  const JoinDate = (data.JoinDate && data.JoinDate.toString().trim() !== '') ? data.JoinDate.toString().trim() : null;
  const DOB = (data.DOB && data.DOB.toString().trim() !== '') ? data.DOB.toString().trim() : null;
  const WeekOff = data.WeekOff || null;
  const Designation = data.Designation || null;
  const Grade = data.Grade || null;
  const UAN = data.UAN || null;
  const ESI = data.ESI || null;
  const ProbationPeriod = data.ProbationPeriod || null;
  const FatherName = data.FatherName || null;
  const PanNumber = data.PanNumber || null;
  const AadharNumber = data.AadharNumber || null;

  // Salary fields
  const basic_salary = parseFloat(data.basic_salary) || 0;
  const da = parseFloat(data.da) || 0;
  const hra = parseFloat(data.hra) || 0;
  const conveyance = parseFloat(data.conveyance) || 0;
  const special_allowance = parseFloat(data.special_allowance) || 0;
  const pf_deduction = parseFloat(data.pf_deduction !== undefined ? data.pf_deduction : data.epf) || 0;
  const esi_deduction = parseFloat(data.esi_deduction !== undefined ? data.esi_deduction : data.esi_amount) || 0;
  const tds = parseFloat(data.tds) || 0;
  const advance = parseFloat(data.advance) || 0;
  const lwf = parseFloat(data.lwf) || 0;
  const performance_bonus = parseFloat(data.performance_bonus) || 0;
  const gwr_inc = parseFloat(data.gwr_inc) || 0;

  if (!EmpId || !Name || !Password || !Shift || !Array.isArray(offices) || offices.length === 0) {
    const missing = [];
    if (!EmpId) missing.push('EmpId');
    if (!Name) missing.push('Name');
    if (!Password) missing.push('Password');
    if (!Shift) missing.push('Shift');
    if (!offices || offices.length === 0) missing.push('Offices');
    response.message = 'Missing required field(s): ' + missing.join(', ');
    return res.json(response);
  }

  const conn = await db.getConnection();
  try {
    const [existRows] = await conn.query(
      'SELECT COUNT(*) as count FROM Employees WHERE EmpId = ?',
      [EmpId]
    );

    if (existRows[0].count > 0) {
      conn.release();
      response.message = 'Employee ID already exists. Please use a different ID.';
      return res.json(response);
    }

    await conn.beginTransaction();

    // Map offices
    const officeIds = [];
    for (const office of offices) {
      const officeName = (office.OfficeName || '').trim();
      const latLong = (office.LatLong || '').trim();

      // 1. Try exact OfficeName and LatLong match
      let [offRows] = await conn.query(
        'SELECT id, OfficeId FROM EmployeeOffice WHERE OfficeName = ? AND LatLong = ? LIMIT 1',
        [officeName, latLong]
      );

      // 2. Fallback: match by OfficeName alone (case-insensitive)
      if (!offRows || offRows.length === 0) {
        [offRows] = await conn.query(
          'SELECT id, OfficeId FROM EmployeeOffice WHERE TRIM(LOWER(OfficeName)) = TRIM(LOWER(?)) LIMIT 1',
          [officeName]
        );
      }

      // 3. Fallback: match by proximity or numeric LatLong coordinates if provided
      if ((!offRows || offRows.length === 0) && latLong) {
        const parts = latLong.split(',');
        if (parts.length === 2) {
          const lat = parseFloat(parts[0]);
          const lon = parseFloat(parts[1]);
          if (!isNaN(lat) && !isNaN(lon)) {
            [offRows] = await conn.query(
              'SELECT id, OfficeId FROM EmployeeOffice WHERE ABS(Latitude - ?) < 0.001 AND ABS(Longitude - ?) < 0.001 LIMIT 1',
              [lat, lon]
            );
          }
        }
      }

      // 4. Fallback: match by id or OfficeId if provided in object
      if ((!offRows || offRows.length === 0) && (office.Id || office.OfficeId || office.id)) {
        const targetId = office.Id || office.OfficeId || office.id;
        [offRows] = await conn.query(
          'SELECT id, OfficeId FROM EmployeeOffice WHERE id = ? OR OfficeId = ? LIMIT 1',
          [targetId, targetId]
        );
      }

      if (!offRows || offRows.length === 0) {
        throw new Error(`Office not found: ${officeName || 'Unnamed'}`);
      }

      const matchedId = offRows[0].id || offRows[0].OfficeId || offRows[0].Id;
      officeIds.push(matchedId);
    }

    const assignedOfficeId = officeIds.join(',');
    const hashedPassword = hashPassword(Password);

    const insertSql = `
      INSERT INTO Employees 
      (EmpId, Name, Password, Mobile, EmailId, Role, OTP, IsOTPExpired, IsGeofence, Tenent_Id, IsActive, CreateDate, RM, Shift, ResetTime, DOB, JoinDate, OfficeId, WeekOff, Designation, Grade, UAN, ESI, ProbationPeriod, FatherName, PanNumber, AadharNumber, basic_salary, da, hra, conveyance, special_allowance, pf_deduction, esi_deduction, tds, advance, lwf, performance_bonus, gwr_inc) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await conn.execute(insertSql, [
      EmpId,
      Name,
      hashedPassword,
      Mobile,
      EmailId,
      Role,
      OTP,
      IsOTPExpired,
      IsGeofence,
      Tenent_Id,
      IsActive,
      CreateDate,
      RM,
      Shift,
      ResetTime,
      DOB,
      JoinDate,
      assignedOfficeId,
      WeekOff,
      Designation,
      Grade,
      UAN,
      ESI,
      ProbationPeriod,
      FatherName,
      PanNumber,
      AadharNumber,
      basic_salary,
      da,
      hra,
      conveyance,
      special_allowance,
      pf_deduction,
      esi_deduction,
      tds,
      advance,
      lwf,
      performance_bonus,
      gwr_inc
    ]);

    // Also sync to salary_structure_new
    const grossSalary = basic_salary + da + hra + conveyance + special_allowance;
    const totalDeductions = pf_deduction + esi_deduction + tds + advance + lwf;
    const netSalary = grossSalary - totalDeductions;

    try {
      await conn.execute(
        `INSERT INTO salary_structure_new (
          empId, emp_name, designation, department, grade, date_of_joining,
          basic_salary, basic_salary_per_annum, hra, hra_per_annum,
          conveyance, conveyance_per_annum, special_allowance, special_allowance_per_annum,
          gross_salary, gross_salary_per_annum, epf, epf_per_annum,
          esi, esi_per_annum, total_benefits, total_benefits_per_annum,
          total_cost_of_company, net_take_home, Tenent_Id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          emp_name = VALUES(emp_name),
          designation = VALUES(designation),
          department = VALUES(department),
          grade = VALUES(grade),
          basic_salary = VALUES(basic_salary),
          hra = VALUES(hra),
          conveyance = VALUES(conveyance),
          special_allowance = VALUES(special_allowance),
          gross_salary = VALUES(gross_salary),
          epf = VALUES(epf),
          esi = VALUES(esi),
          net_take_home = VALUES(net_take_home)`,
        [
          EmpId, Name, Designation || '', Role || '', Grade || 'A', JoinDate || null,
          basic_salary + da, (basic_salary + da) * 12, hra, hra * 12,
          conveyance, conveyance * 12, special_allowance, special_allowance * 12,
          grossSalary, grossSalary * 12, pf_deduction, pf_deduction * 12,
          esi_deduction, esi_deduction * 12, 0, 0,
          grossSalary, netSalary, Tenent_Id || 1
        ]
      );
    } catch (_) {}

    // Add default leave balance
    await conn.execute(
      'INSERT INTO EmployeeLeave (EmpId, SL, EL, Tenent_Id) VALUES (?, 1, 0.00, ?)',
      [EmpId, Tenent_Id || 1]
    );

    await conn.commit();
    response.success = true;
    response.message = 'Employee, office details, and leave balances added successfully.';
    return res.json(response);
  } catch (err) {
    await conn.rollback();
    console.error('Error in addEmployee:', err);
    response.message = `An error occurred: ${err.message}`;
    return res.json(response);
  } finally {
    conn.release();
  }
};

// 2. Edit Employee (src/employee/edit_employee.php);

module.exports = addEmployee;
