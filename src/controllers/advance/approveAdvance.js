const db = require('../../config/db');

/**
 * Approve or Reject Advance Request
 * POST /advance/approve_advance.php or /advance/approve
 */
const approveAdvance = async (req, res) => {
  const response = { success: false, message: '' };
  const data = req.body || {};

  const id = data.id || data.Id || data.advanceId || data.advance_id || '';
  const status = (data.status || data.Status || '').trim();
  const approverId = data.approved_by || data.userEmpId || data.empId || data.emp_id || (req.user && (req.user.emp_id || req.user.EmpId)) || '';
  const userRole = data.role || (req.user && (req.user.role || req.user.Role)) || '';
  const remarks = (data.remarks || '').trim();

  const isAdmin = ['Admin', 'admin', 'SuperAdmin'].includes(userRole);

  if (!id) {
    response.message = 'Advance Request ID is required.';
    return res.status(400).json(response);
  }

  if (!['Approved', 'Rejected'].includes(status)) {
    response.message = 'Status must be either "Approved" or "Rejected".';
    return res.status(400).json(response);
  }

  if (!approverId) {
    response.message = 'Approver Employee ID is required.';
    return res.status(400).json(response);
  }

  try {
    // Check request exists
    const [reqRows] = await db.query(
      `SELECT ar.*, e.RM 
       FROM advance_requests ar 
       LEFT JOIN Employees e ON ar.EmpId COLLATE utf8mb4_unicode_ci = e.EmpId COLLATE utf8mb4_unicode_ci 
       WHERE ar.id = ? LIMIT 1`,
      [id]
    );

    if (!reqRows || reqRows.length === 0) {
      response.message = 'Advance request not found.';
      return res.status(404).json(response);
    }

    const advanceReq = reqRows[0];

    // Self-approval restriction
    if (!isAdmin && String(advanceReq.EmpId).trim().toLowerCase() === String(approverId).trim().toLowerCase()) {
      response.message = 'Employees cannot approve or reject their own advance requests. It must be approved by their Reporting Manager or Admin.';
      return res.status(403).json(response);
    }

    // Permission check for RM: Must be employee's RM or Admin
    if (!isAdmin) {
      const [rmCheck] = await db.query(
        `SELECT EmpId FROM Employees 
         WHERE EmpId = ? 
           AND (RM COLLATE utf8mb4_unicode_ci = ? OR RM COLLATE utf8mb4_unicode_ci = (SELECT Name COLLATE utf8mb4_unicode_ci FROM Employees WHERE EmpId = ? LIMIT 1))
         LIMIT 1`,
        [advanceReq.EmpId, approverId, approverId]
      );

      if (!rmCheck || rmCheck.length === 0) {
        response.message = 'You are not authorized to approve this advance request. Only the assigned Reporting Manager or Admin can take action.';
        return res.status(403).json(response);
      }
    }

    const updateSql = `
      UPDATE advance_requests 
      SET status = ?, approved_by = ?, approval_date = NOW(), remarks = ? 
      WHERE id = ?
    `;

    await db.execute(updateSql, [status, approverId, remarks || null, id]);

    response.success = true;
    response.message = `Advance request has been successfully ${status.toLowerCase()}.`;
    return res.status(200).json(response);
  } catch (err) {
    console.error('Error in approveAdvance:', err);
    response.message = `Failed to update advance request: ${err.message}`;
    return res.status(500).json(response);
  }
};

module.exports = approveAdvance;
