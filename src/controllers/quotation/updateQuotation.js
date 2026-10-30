const db = require('../../config/db');

const updateQuotation = async (req, res) => {
  const response = { success: false, message: '', data: null };
  const data = req.body || {};
  const id = req.params.id || data.id;

  if (!id) {
    response.message = 'Quotation ID is required for update.';
    return res.status(400).json(response);
  }

  try {
    const [existing] = await db.query('SELECT * FROM Quotations WHERE id = ? LIMIT 1', [id]);
    if (!existing || existing.length === 0) {
      response.message = 'Quotation not found.';
      return res.status(404).json(response);
    }

    const current = existing[0];

    // Status quick-update
    if (data.status && Object.keys(data).length <= 3) {
      await db.query('UPDATE Quotations SET status = ? WHERE id = ?', [data.status, id]);
      
      let emailSent = false;
      if (['Sent', 'Approved'].includes(data.status) && current.client_email) {
        const { sendQuotationEmail } = require('./quotationEmail');
        const { getRmEmailForEmployee } = require('./quotationHelper');
        const rmEmail = await getRmEmailForEmployee(db, current.emp_id || current.prepared_by);
        let parsedItems = [];
        try {
          parsedItems = typeof current.items === 'string' ? JSON.parse(current.items) : (current.items || []);
        } catch (_) {}
        const emailResult = await sendQuotationEmail({
          ...current,
          items: parsedItems,
          cc: rmEmail
        });
        emailSent = emailResult.sent;
      }

      response.success = true;
      response.message = emailSent
        ? `Status updated to ${data.status} and quotation emailed to ${current.client_email}.`
        : `Status updated to ${data.status}.`;
      return res.json(response);
    }

    // Block full edit if quotation has already been sent or submitted for approval
    const isLocked = ['Sent', 'Approved', 'Pending Approval', 'Pending'].includes(current.status);
    if (isLocked) {
      response.message = 'Quotation cannot be edited once it has been sent or submitted for approval.';
      return res.status(400).json(response);
    }

    // Full update with recalculation
    let items = Array.isArray(data.items) ? data.items : [];
    if (typeof data.items === 'string') {
      try {
        items = JSON.parse(data.items);
      } catch (_) {
        items = [];
      }
    }

    let calculatedSubtotal = 0;
    const formattedItems = items.map((it, idx) => {
      const qty = parseFloat(it.qty) || 0;
      const rate = parseFloat(it.rate) || 0;
      const disc = parseFloat(it.discount) || 0;
      const rawAmt = qty * rate;
      const discountVal = (rawAmt * disc) / 100;
      const netAmt = Math.round((rawAmt - discountVal) * 100) / 100;

      calculatedSubtotal += netAmt;

      return {
        s_no: idx + 1,
        description: it.description || it.item_name || '',
        hsn: it.hsn || it.hsn_code || '3004',
        pack: it.pack || it.unit || 'Box',
        qty: qty,
        rate: rate,
        discount: disc,
        amount: netAmt
      };
    });

    const subtotal = data.subtotal !== undefined ? parseFloat(data.subtotal) : calculatedSubtotal;
    const discountPercent = data.discount_percent !== undefined ? parseFloat(data.discount_percent) : current.discount_percent;
    const discountAmount = data.discount_amount !== undefined 
      ? parseFloat(data.discount_amount) 
      : Math.round(((subtotal * discountPercent) / 100) * 100) / 100;

    const afterDiscount = Math.max(0, subtotal - discountAmount);
    const taxType = (data.tax_type || current.tax_type || 'GST').toUpperCase();
    const taxPercent = data.tax_percent !== undefined ? parseFloat(data.tax_percent) : parseFloat(current.tax_percent);
    const taxAmount = data.tax_amount !== undefined
      ? parseFloat(data.tax_amount)
      : Math.round(((afterDiscount * taxPercent) / 100) * 100) / 100;

    const totalAmount = data.total_amount !== undefined
      ? parseFloat(data.total_amount)
      : Math.round((afterDiscount + taxAmount) * 100) / 100;

    const sql = `
      UPDATE Quotations SET
        client_name = ?,
        client_email = ?,
        client_phone = ?,
        client_address = ?,
        client_gst = ?,
        subject = ?,
        quotation_date = ?,
        valid_until = ?,
        items = ?,
        subtotal = ?,
        discount_percent = ?,
        discount_amount = ?,
        tax_type = ?,
        tax_percent = ?,
        tax_amount = ?,
        total_amount = ?,
        status = ?,
        terms_conditions = ?,
        notes = ?,
        prepared_by = ?
      WHERE id = ?
    `;

    await db.query(sql, [
      data.client_name || current.client_name,
      data.client_email !== undefined ? data.client_email : current.client_email,
      data.client_phone !== undefined ? data.client_phone : current.client_phone,
      data.client_address !== undefined ? data.client_address : current.client_address,
      data.client_gst !== undefined ? data.client_gst : current.client_gst,
      data.subject !== undefined ? data.subject : current.subject,
      data.quotation_date || current.quotation_date,
      data.valid_until !== undefined ? data.valid_until : current.valid_until,
      formattedItems.length > 0 ? JSON.stringify(formattedItems) : current.items,
      subtotal,
      discountPercent,
      discountAmount,
      taxType,
      taxPercent,
      taxAmount,
      totalAmount,
      data.status || current.status,
      data.terms_conditions !== undefined ? data.terms_conditions : current.terms_conditions,
      data.notes !== undefined ? data.notes : current.notes,
      data.prepared_by !== undefined ? data.prepared_by : current.prepared_by,
      id
    ]);

    response.success = true;
    response.message = 'Quotation updated successfully.';
    response.data = { id, total_amount: totalAmount };
    return res.json(response);
  } catch (err) {
    console.error('Error updating quotation:', err);
    response.message = `Database Error: ${err.message}`;
    return res.status(500).json(response);
  }
};

module.exports = updateQuotation;
