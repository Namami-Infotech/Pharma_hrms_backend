const db = require('../../config/db');

const getExpense = async (req, res) => {
  const response = { success: false, data: [], message: '' };
  const empId = req.query.EmpId || '';
  const role = req.query.role || '';

  if (!empId) {
    response.message = 'Please provide a valid Employee ID.';
    return res.json(response);
  }

  try {
    let sql = '';
    const params = [];

    if (role === 'HR') {
      sql = `SELECT detailId, batchId, empId, expenseDate, expenseType, expenseAmount, image, Status 
             FROM ExpenseDetails ORDER BY expenseDate DESC`;
    } else {
      sql = `SELECT detailId, batchId, empId, expenseDate, expenseType, expenseAmount, image, Status 
             FROM ExpenseDetails WHERE empId = ? ORDER BY expenseDate DESC`;
      params.push(empId);
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
