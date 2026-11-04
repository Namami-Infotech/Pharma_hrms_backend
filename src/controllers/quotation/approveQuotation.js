const db = require('../../config/db');
const { sendQuotationEmail } = require('./quotationEmail');

/**
 * POST /quotation/approve/:id (or with { id } in body)
 * Approves a quotation and immediately emails it to the client
 */
const approveQuotation = async (req, res) => {
  const response = { success: false, message: '', data: null };
  const id = req.params.id || req.body.id;

  if (!id) {
    response.message = 'Quotation ID is required for approval.';
    return res.status(400).json(response);
  }

  try {
    const [rows] = await db.query('SELECT * FROM Quotations WHERE id = ? LIMIT 1', [id]);
    if (!rows || rows.length === 0) {
      response.message = 'Quotation not found.';
      return res.status(404).json(response);
    }

    const quotation = rows[0];

    // 1. If already approved or sent, reject further status changes
    if (['Approved', 'Sent'].includes(quotation.status)) {
      response.message = 'This quotation is already ' + quotation.status + '. Status cannot be modified.';
      return res.status(400).json(response);
    }

    // Determine who is approving (passed from frontend user session)
    const approvedBy = req.body.approved_by || req.body.approvedBy || (req.user && (req.user.username || req.user.Name || req.user.EmpId)) || null;
    const approverEmpId = req.body.emp_id || req.body.empId || req.body.EmpId || (req.user && (req.user.emp_id || req.user.EmpId)) || null;
    const role = (req.body.role || req.body.Role || (req.user && req.user.role) || '').toString();
    const isAdmin = ['Admin', 'admin', 'SuperAdmin'].includes(role);
    const creatorId = quotation.emp_id || quotation.EmpId;
    const creatorName = quotation.prepared_by;

    // 2. RM cannot approve their own quotation
    if (!isAdmin) {
      const isSelf = (approverEmpId && creatorId && String(approverEmpId).trim() === String(creatorId).trim()) ||
                     (approvedBy && creatorName && String(approvedBy).trim() === String(creatorName).trim()) ||
                     (approverEmpId && creatorName && String(approverEmpId).trim() === String(creatorName).trim());
      if (isSelf) {
        response.message = 'Reporting Managers cannot approve their own quotation.';
        return res.status(403).json(response);
      }
    }

    const { getRmEmailForEmployee } = require('./quotationHelper');

    // Update status to 'Approved' and record approved_by & approval_date
    try {
      await db.query(
        'UPDATE Quotations SET status = ?, approved_by = ?, approval_date = CURRENT_TIMESTAMP WHERE id = ?',
        ['Approved', approvedBy, id]
      );
    } catch (colErr) {
      if (colErr.code === 'ER_BAD_FIELD_ERROR') {
        console.warn('approved_by or approval_date column missing in Quotations table. Updating status only.');
        await db.query('UPDATE Quotations SET status = ? WHERE id = ?', ['Approved', id]);
      } else {
        throw colErr;
      }
    }
    quotation.status = 'Approved';
    quotation.approved_by = approvedBy;

    // Parse items if string
    if (typeof quotation.items === 'string') {
      try {
        quotation.items = JSON.parse(quotation.items);
      } catch (_) {
        quotation.items = [];
      }
    }

    // Lookup RM email for CC
    const rmEmail = await getRmEmailForEmployee(db, quotation.emp_id || quotation.prepared_by);

    // Trigger email send with CC to RM
    let emailResult = { sent: false };
    if (quotation.client_email) {
      emailResult = await sendQuotationEmail(quotation, { cc: rmEmail });
    }

    response.success = true;
    response.message = emailResult.sent
      ? `Quotation ${quotation.quotation_no} approved and sent to ${quotation.client_email}${rmEmail ? ` (CC: ${rmEmail})` : ''}.`
      : `Quotation ${quotation.quotation_no} approved (Status: Approved).`;
    response.data = {
      id,
      quotation_no: quotation.quotation_no,
      status: 'Approved',
      email_sent: emailResult.sent,
      email_recipient: quotation.client_email || null,
      cc_recipient: rmEmail || null
    };

    return res.json(response);
  } catch (err) {
    console.error('Error approving quotation:', err);
    response.message = err.message;
    return res.status(500).json(response);
  }
};

module.exports = approveQuotation;
