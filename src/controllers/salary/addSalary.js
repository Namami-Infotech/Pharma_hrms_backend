const db = require('../../config/db');
const { calculateWeeklyOffs } = require('./salaryHelper');

const addSalary = async (req, res) => {
  const response = { success: false, message: '' };
  const data = req.body || {};

  if (!data.empId || !data.emp_name || !data.grade) {
    response.message = 'Employee ID, Name, and Grade are required.';
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
    `;

    await db.execute(insertSql, [
      data.empId,
      data.emp_name,
      data.designation,
      data.department,
      data.grade,
      data.date_of_joining,
      data.basic_salary,
      data.basic_salary_per_annum,
      data.hra,
      data.hra_per_annum,
      data.conveyance,
      data.conveyance_per_annum,
      data.special_allowance,
      data.special_allowance_per_annum,
      data.gross_salary,
      data.gross_salary_per_annum,
      data.epf,
      data.epf_per_annum,
      data.esi,
      data.esi_per_annum,
      data.total_benefits,
      data.total_benefits_per_annum,
      data.total_cost_of_company,
      data.net_take_home
    ]);

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
