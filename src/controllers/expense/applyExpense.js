const db = require('../../config/db');

const applyExpense = async (req, res) => {
  const response = { success: false, message: '' };
  const data = req.body || {};
  const expenses = data.expenses || [];

  if (!Array.isArray(expenses) || expenses.length === 0) {
    response.message = 'No expenses provided.';
    return res.json(response);
  }

  const batchId = `batch_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const insertSql = `
      INSERT INTO ExpenseDetails (batchId, empId, expenseDate, expenseType, expenseAmount, image, Status) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    for (const exp of expenses) {
      const empId = exp.empId || '';
      const expenseDate = exp.expenseDate || '';
      const expenseType = exp.expenseType || '';
      const expenseAmount = exp.expenseAmount || '';
      const image = exp.image || null;
      const Status = exp.Status || null;

      if (!empId || !expenseDate || !expenseType || !expenseAmount) {
        await conn.rollback();
        response.message = 'Please provide valid expense data.';
        return res.json(response);
      }

      await conn.execute(insertSql, [
        batchId,
        empId,
        expenseDate,
        expenseType,
        expenseAmount,
        image,
        Status
      ]);
    }

    await conn.commit();
    response.success = true;
    response.message = `Expenses applied successfully with batch ID: ${batchId}.`;
    return res.json(response);
  } catch (err) {
    await conn.rollback();
    console.error('Error in applyExpense:', err);
    response.message = `An error occurred: ${err.message}`;
    return res.status(500).json(response);
  } finally {
    conn.release();
  }
};

// 2. Get Expenses (src/expense/get_expense.php);

module.exports = applyExpense;
