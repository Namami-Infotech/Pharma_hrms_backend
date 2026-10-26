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

    // Update status to 'Sent'
    await db.query('UPDATE Quotations SET status = ? WHERE id = ?', ['Sent', id]);
    quotation.status = 'Sent';

    // Parse items if string
    if (typeof quotation.items === 'string') {
      try {
        quotation.items = JSON.parse(quotation.items);
      } catch (_) {
        quotation.items = [];
      }
    }

    // Trigger email send
    let emailResult = { sent: false };
    if (quotation.client_email) {
      emailResult = await sendQuotationEmail(quotation);
    }

    response.success = true;
    response.message = emailResult.sent
      ? `Quotation ${quotation.quotation_no} approved and sent to ${quotation.client_email}.`
      : `Quotation ${quotation.quotation_no} approved (Status: Sent).`;
    response.data = {
      id,
      quotation_no: quotation.quotation_no,
      status: 'Sent',
      email_sent: emailResult.sent,
      email_recipient: quotation.client_email || null
    };

    return res.json(response);
  } catch (err) {
    console.error('Error approving quotation:', err);
    response.message = err.message;
    return res.status(500).json(response);
  }
};

module.exports = approveQuotation;
