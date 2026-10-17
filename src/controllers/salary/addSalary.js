const db = require('../../config/db');
const { calculateWeeklyOffs } = require('./salaryHelper');

const addSalary = async (req, res) => {
  const response = { success: false, message: '' };
  const data = req.body || {};

  const empId = (data.empId || data.EmpId || '').toString().trim();
  const empName = data.emp_name || data.Name || data.empName || '';
  const grade = data.grade || data.Grade || 'A';

  if (!empId || !empName) {
    response.message = 'Employee ID and Name are required.';
    return res.json(response);
  }

  try {
    const insertSql = `
      INSERT INTO salary_structure_new (
        empId, emp_name, designation, department, grade, date_of_joining,
        basic_salary, basic_salary_per_annum,
        hra, hra_per_annum, conveyance, conveyance_per_annum,
        special_allowance, special_allowance_per_annum, gross_salary, gross_salary_per_annum,
        epf, epf_per_annum, esi, esi_per_annum,
        total_benefits, total_benefits_per_annum,
        total_cost_of_company, net_take_home
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        emp_name = VALUES(emp_name),
        designation = VALUES(designation),
        department = VALUES(department),
        grade = VALUES(grade),
        date_of_joining = VALUES(date_of_joining),
        basic_salary = VALUES(basic_salary),
        basic_salary_per_annum = VALUES(basic_salary_per_annum),
        hra = VALUES(hra),
        hra_per_annum = VALUES(hra_per_annum),
        conveyance = VALUES(conveyance),
        conveyance_per_annum = VALUES(conveyance_per_annum),
        special_allowance = VALUES(special_allowance),
        special_allowance_per_annum = VALUES(special_allowance_per_annum),
        gross_salary = VALUES(gross_salary),
        gross_salary_per_annum = VALUES(gross_salary_per_annum),
        epf = VALUES(epf),
        epf_per_annum = VALUES(epf_per_annum),
        esi = VALUES(esi),
        esi_per_annum = VALUES(esi_per_annum),
        total_benefits = VALUES(total_benefits),
        total_benefits_per_annum = VALUES(total_benefits_per_annum),
        total_cost_of_company = VALUES(total_cost_of_company),
        net_take_home = VALUES(net_take_home)
    `;

    await db.execute(insertSql, [
      empId,
      empName,
      data.designation || '',
      data.department || '',
      grade,
      data.date_of_joining || null,
      parseFloat(data.basic_salary) || 0,
      parseFloat(data.basic_salary_per_annum) || 0,
      parseFloat(data.hra) || 0,
      parseFloat(data.hra_per_annum) || 0,
      parseFloat(data.conveyance) || 0,
      parseFloat(data.conveyance_per_annum) || 0,
      parseFloat(data.special_allowance) || 0,
      parseFloat(data.special_allowance_per_annum) || 0,
      parseFloat(data.gross_salary) || 0,
      parseFloat(data.gross_salary_per_annum) || 0,
      parseFloat(data.epf) || 0,
      parseFloat(data.epf_per_annum) || 0,
      parseFloat(data.esi) || 0,
      parseFloat(data.esi_per_annum) || 0,
      parseFloat(data.total_benefits) || 0,
      parseFloat(data.total_benefits_per_annum) || 0,
      parseFloat(data.total_cost_of_company) || 0,
      parseFloat(data.net_take_home) || 0
    ]);

    // Also sync to legacy salary_structure for calculateSalary
    try {
      await db.execute(
        `INSERT INTO salary_structure (EmpId, Basic_Salary) 
         VALUES (?, ?) 
         ON DUPLICATE KEY UPDATE Basic_Salary = VALUES(Basic_Salary)`,
        [empId, parseFloat(data.basic_salary) || 0]
      );
    } catch (_) {}

    response.success = true;
    response.message = 'Salary details added successfully.';
    return res.json(response);
  } catch (err) {
    console.error('Error in addSalary:', err);
    response.message = `Error adding salary details: ${err.message}`;
    return res.status(500).json(response);
  }
};

// 2. Calculate Salary (src/salary/calculate_salary.php);

module.exports = addSalary;
