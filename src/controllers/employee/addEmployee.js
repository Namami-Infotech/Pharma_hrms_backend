const db = require('../../config/db');
const { hashPassword } = require('./employeeHelper');

const addEmployee = async (req, res) => {
  const response = { success: false, message: '' };
  const data = req.body || {};

  const EmpId = (data.EmpId || '').toString().trim();
  const Name = (data.Name || '').toString().trim();
  const Password = (data.Password || '').toString();
  const Shift = (data.Shift || '9:00 AM - 6:00 PM').toString().trim();
  const Mobile = data.Mobile || '';
  const EmailId = data.EmailId || '';
  const Role = data.Role || data.new_role || '';
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
  const Department = (data.Department || data.department || '').toString().trim() || null;
  const Grade = data.Grade || null;
  const UAN = data.UAN || null;
  const ESI = data.ESI || null;
  const ProbationPeriod = data.ProbationPeriod || null;
  const FatherName = data.FatherName || null;
  const PanNumber = data.PanNumber ? data.PanNumber.toString().trim().toUpperCase() : null;
  const AadharNumber = data.AadharNumber || null;

  // Salary fields
  const basic_salary = parseFloat(data.basic_salary) || 0;
  const da = parseFloat(data.da) || 0;
  const hra = parseFloat(data.hra) || 0;
  const conveyance = parseFloat(data.conveyance) || 0;
  const special_allowance = parseFloat(data.special_allowance) || 0;
  const pf_deduction = parseFloat(data.pf_deduction !== undefined ? data.pf_deduction : data.epf) || 0;
  const esi_deduction = parseFloat(data.esi_deduction !== undefined ? data.esi_deduction : data.esi_amount) || 0;
  const other_deduction = parseFloat(data.other_deduction) || 0;
  const tds = parseFloat(data.tds) || 0;
  const advance = parseFloat(data.advance) || 0;
  const lwf = parseFloat(data.lwf) || 0;
  const performance_bonus = parseFloat(data.performance_bonus) || 0;
  const gwr_inc = parseFloat(data.gwr_inc) || 0;

  const requiredFields = {
    EmpId, Name, Password, Mobile, EmailId, Role, WeekOff,
    Designation, DOB, JoinDate
  };
  const missing = Object.keys(requiredFields)
    .filter((field) => !String(requiredFields[field] || '').trim());
  if (missing.length > 0) {
    response.message = 'Missing required field(s): ' + missing.join(', ');
    return res.json(response);
  }
  if (!/^\d{10}$/.test(String(Mobile).trim())) {
    response.message = 'Mobile must contain exactly 10 digits.';
    return res.json(response);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(EmailId).trim())) {
    response.message = 'Please provide a valid email address.';
    return res.json(response);
  }
  if (DOB) {
    const birthDate = new Date(DOB);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    if (age < 18) {
      response.message = 'Employee must be at least 18 years old.';
      return res.json(response);
    }
  }
  if (PanNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(PanNumber)) {
    response.message = 'Invalid PAN format. Must be 5 letters, 4 digits, and 1 letter (e.g. ABCDE1234F).';
    return res.json(response);
  }
  if (UAN && String(UAN).trim() !== '' && String(UAN).trim() !== '0' && !/^\d{12}$/.test(String(UAN).trim())) {
    response.message = 'UAN must contain exactly 12 digits (or leave blank).';
    return res.json(response);
  }
  if (ESI && String(ESI).trim() !== '' && String(ESI).trim() !== '0' && !/^\d{10,17}$/.test(String(ESI).trim())) {
    response.message = 'ESI must be a valid number (or leave blank).';
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

    const assignedOfficeId = null;
    const hashedPassword = hashPassword(Password);

    const insertSql = `
      INSERT INTO Employees 
      (EmpId, Name, Password, Mobile, EmailId, Role, OTP, IsOTPExpired, IsGeofence, Tenent_Id, IsActive, CreateDate, RM, Shift, ResetTime, DOB, JoinDate, OfficeId, WeekOff, Designation, Department, Grade, UAN, ESI, ProbationPeriod, FatherName, PanNumber, AadharNumber, basic_salary, da, hra, conveyance, special_allowance, pf_deduction, esi_deduction, other_deduction, tds, advance, lwf, performance_bonus, gwr_inc) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      Department,
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
      other_deduction,
      tds,
      advance,
      lwf,
      performance_bonus,
      gwr_inc
    ]);

    // Also sync to salary_structure_new
    const grossSalary = basic_salary + da + hra + conveyance + special_allowance;
    const totalDeductions = pf_deduction + esi_deduction + other_deduction + tds + advance + lwf;
    const netSalary = grossSalary - totalDeductions;

    try {
      await conn.execute(
        `INSERT INTO salary_structure_new (
          empId, emp_name, designation, department, grade, date_of_joining,
          basic_salary, basic_salary_per_annum, hra, hra_per_annum,
          conveyance, conveyance_per_annum, special_allowance, special_allowance_per_annum,
          gross_salary, gross_salary_per_annum, epf, epf_per_annum,
          esi, esi_per_annum, other_deduction, other_deduction_per_annum,
          total_benefits, total_benefits_per_annum,
          total_cost_of_company, net_take_home, Tenent_Id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
          other_deduction = VALUES(other_deduction),
          other_deduction_per_annum = VALUES(other_deduction_per_annum),
          net_take_home = VALUES(net_take_home)`,
        [
          EmpId, Name, Designation || '', Department || Role || '', Grade || 'A', JoinDate || null,
          basic_salary + da, (basic_salary + da) * 12, hra, hra * 12,
          conveyance, conveyance * 12, special_allowance, special_allowance * 12,
          grossSalary, grossSalary * 12, pf_deduction, pf_deduction * 12,
          esi_deduction, esi_deduction * 12, other_deduction, other_deduction * 12,
          0, 0, grossSalary, netSalary, Tenent_Id || 1
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
