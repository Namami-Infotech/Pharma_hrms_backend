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

    const { getRmEmailForEmployee } = require('./quotationHelper');

    // Update status to 'Approved'
    await db.query('UPDATE Quotations SET status = ? WHERE id = ?', ['Approved', id]);
    quotation.status = 'Approved';

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
