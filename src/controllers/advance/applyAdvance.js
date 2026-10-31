const db = require('../../config/db');

/**
 * Apply for Advance Payment Request
 * POST /advance/apply_advance.php or /advance/apply
 */
const applyAdvance = async (req, res) => {
  const response = { success: false, message: '' };
  const data = req.body || {};

  const empId = data.emp_id || data.empId || data.EmpId || data.empid || (req.user && (req.user.emp_id || req.user.EmpId)) || '';
  const amount = parseFloat(data.amount) || 0;
  const deductionMonth = parseInt(data.deductionMonth || data.deduction_month || data.month, 10);
  const deductionYear = parseInt(data.deductionYear || data.deduction_year || data.year, 10);
  const reason = (data.reason || '').trim();
  const tenantId = data.Tenent_Id || data.tenent_id || (req.user && req.user.Tenent_Id) || 1;

  if (!empId) {
    response.message = 'Employee ID is required.';
    return res.status(400).json(response);
  }

  if (amount <= 0) {
    response.message = 'Please enter a valid advance amount greater than 0.';
    return res.status(400).json(response);
  }

  if (!deductionMonth || deductionMonth < 1 || deductionMonth > 12) {
    response.message = 'Please specify a valid deduction month (1 - 12).';
    return res.status(400).json(response);
  }

  if (!deductionYear || deductionYear < 2020 || deductionYear > 2100) {
    response.message = 'Please specify a valid deduction year.';
    return res.status(400).json(response);
  }

  if (!reason) {
    response.message = 'Please provide a reason for the advance payment request.';
    return res.status(400).json(response);
  }

  try {
    // Check if employee exists
    const [empRows] = await db.query(
      'SELECT EmpId, Name, RM FROM Employees WHERE EmpId = ? LIMIT 1',
      [empId]
    );

    if (!empRows || empRows.length === 0) {
      response.message = `Employee with ID ${empId} not found.`;
      return res.status(404).json(response);
    }

    // Insert advance request
    const insertSql = `
      INSERT INTO advance_requests 
        (EmpId, amount, deduction_month, deduction_year, reason, status, Tenent_Id) 
      VALUES (?, ?, ?, ?, ?, 'Pending', ?)
    `;

    const [result] = await db.execute(insertSql, [
      empId,
      amount,
      deductionMonth,
      deductionYear,
      reason,
      tenantId
    ]);

    response.success = true;
    response.message = 'Advance payment request submitted successfully and sent for approval.';
    response.id = result.insertId;

    return res.status(200).json(response);
  } catch (err) {
    console.error('Error in applyAdvance:', err);
    response.message = `Failed to submit advance request: ${err.message}`;
    return res.status(500).json(response);
  }
};

module.exports = applyAdvance;
