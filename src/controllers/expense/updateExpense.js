const db = require('../../config/db');

const updateExpense = async (req, res) => {
  const response = { success: false, message: '' };
  const input = req.body || {};

  const detailId = input.detailId || '';
  const status = input.status || '';
  const role = input.role || '';

  const allowedStatuses = ['Approved', 'Rejected'];

  if (detailId && allowedStatuses.includes(status) && role === 'HR') {
    try {
      const [result] = await db.execute(
        'UPDATE ExpenseDetails SET Status = ? WHERE detailId = ?',
        [status, detailId]
      );

      if (result.affectedRows > 0) {
        response.success = true;
        response.message = 'Expense status updated successfully.';
      } else {
        response.message = 'Failed to update expense status.';
      }

      return res.json(response);
    } catch (err) {
      console.error('Error in updateExpense:', err);
      response.message = `An error occurred: ${err.message}`;
      return res.status(500).json(response);
    }
  } else {
    response.message = 'Invalid input or unauthorized action.';
    return res.json(response);
  }
};

module.exports = updateExpense;
