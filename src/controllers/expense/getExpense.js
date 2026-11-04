const db = require('../../config/db');

const getExpense = async (req, res) => {
  const response = { success: false, data: [], message: '' };
  const empId = req.query.EmpId || req.query.empId || '';
  const role = req.query.role || '';

  const isAdmin = ['Admin', 'admin', 'SuperAdmin', 'HR'].includes(role) ||
    (typeof role === 'string' && role.toLowerCase().includes('admin'));

  if (!empId && !isAdmin) {
    response.message = 'Please provide a valid Employee ID.';
    return res.json(response);
  }

  try {
    let sql = '';
    const params = [];

    if (isAdmin) {
      sql = `SELECT ed.detailId, ed.batchId, ed.empId, ed.expenseDate, ed.expenseType, ed.expenseAmount, ed.image, ed.Status,
             e.Name as employeeName, e.Designation as employeeDesignation
             FROM ExpenseDetails ed
             LEFT JOIN Employees e ON ed.empId = e.EmpId
             ORDER BY ed.expenseDate DESC`;
    } else {
      // RM can view their own expenses AND expenses of employees reporting to them
      sql = `SELECT ed.detailId, ed.batchId, ed.empId, ed.expenseDate, ed.expenseType, ed.expenseAmount, ed.image, ed.Status,
             e.Name as employeeName, e.Designation as employeeDesignation
             FROM ExpenseDetails ed
             LEFT JOIN Employees e ON ed.empId = e.EmpId
             WHERE ed.empId = ? OR ed.empId IN (SELECT EmpId FROM Employees WHERE RM = ? OR RM = (SELECT Name FROM Employees WHERE EmpId = ? LIMIT 1))
             ORDER BY ed.expenseDate DESC`;
      params.push(empId, empId, empId);
    }

    const [rows] = await db.query(sql, params);

    if (rows && rows.length > 0) {
      response.success = true;
      response.data = rows;
    } else {
      response.message = 'No expenses found for the given Employee ID.';
    }

    return res.json(response);
  } catch (err) {
    console.error('Error in getExpense:', err);
    response.message = `An error occurred: ${err.message}`;
    return res.status(500).json(response);
  }
};

// 3. Update Expense Status (src/expense/update_expense.php);

module.exports = getExpense;
