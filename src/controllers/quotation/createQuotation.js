const db = require('../../config/db');

const createQuotation = async (req, res) => {
  const response = { success: false, message: '', data: null };
  const data = req.body || {};

  const clientName = (data.client_name || '').trim();
  if (!clientName) {
    response.message = 'Client Name is required.';
    return res.status(400).json(response);
  }

  const tenantId = data.Tenent_Id || 1;
  const currentYear = new Date().getFullYear();

  try {
    // 1. Auto-generate quotation number if not provided or contains placeholder like PREVIEW/AUTO (Short format: QT-XXXX)
    let quotationNo = (data.quotation_no || '').trim();
    if (!quotationNo || quotationNo.toUpperCase().includes('PREVIEW') || quotationNo.toUpperCase().includes('AUTO')) {
      const [allRows] = await db.query(
        'SELECT quotation_no FROM Quotations'
      );

      let maxNum = 0;
      if (allRows && allRows.length > 0) {
        for (const row of allRows) {
          const m = (row.quotation_no || '').match(/([0-9]+)$/);
          if (m) {
            const num = parseInt(m[1], 10);
            if (num > maxNum) maxNum = num;
          }
        }
      }
      const nextNum = maxNum + 1;
      quotationNo = `QT-${String(nextNum).padStart(4, '0')}`;
    }

    // 2. Parse items and calculate amounts
    let items = Array.isArray(data.items) ? data.items : [];
    if (typeof data.items === 'string') {
      try {
        items = JSON.parse(data.items);
      } catch (_) {
        items = [];
      }
    }

    let calculatedSubtotal = 0;
    let calculatedTaxAmount = 0;
    let calculatedTotal = 0;

    const formattedItems = items.map((it, idx) => {
      const qty = parseFloat(it.qty) || 0;
      const rate = parseFloat(it.rate) || 0;
      const disc = parseFloat(it.discount) || 0;
      const gst = it.gst !== undefined ? parseFloat(it.gst) : 5.0;
      const rawAmt = qty * rate;
      const discountVal = (rawAmt * disc) / 100;
      const taxableAmt = Math.round((rawAmt - discountVal) * 100) / 100;
      const itemGstAmt = Math.round(((taxableAmt * gst) / 100) * 100) / 100;
      const netAmt = it.amount !== undefined ? parseFloat(it.amount) : Math.round((taxableAmt + itemGstAmt) * 100) / 100;

      calculatedSubtotal += taxableAmt;
      calculatedTaxAmount += itemGstAmt;
      calculatedTotal += netAmt;

      return {
        s_no: idx + 1,
        description: it.description || it.item_name || '',
        composition: it.composition || '',
        hsn: it.hsn || it.hsn_code || '3004',
        qty: qty,
        rate: rate,
        discount: disc,
        gst: gst,
        taxable_amount: taxableAmt,
        tax_amount: itemGstAmt,
        amount: netAmt
      };
    });

    const subtotal = data.subtotal !== undefined ? parseFloat(data.subtotal) : Math.round(calculatedSubtotal * 100) / 100;
    const discountPercent = parseFloat(data.discount_percent) || 0;
    const discountAmount = data.discount_amount !== undefined 
      ? parseFloat(data.discount_amount) 
      : Math.round(((subtotal * discountPercent) / 100) * 100) / 100;

    const afterDiscount = Math.max(0, subtotal - discountAmount);
    const taxType = (data.tax_type || 'CGST/SGST').toUpperCase();
    const taxPercent = data.tax_percent !== undefined ? parseFloat(data.tax_percent) : 0;
    const taxAmount = data.tax_amount !== undefined
      ? parseFloat(data.tax_amount)
      : Math.round(calculatedTaxAmount * 100) / 100;

    const totalAmount = data.total_amount !== undefined
      ? parseFloat(data.total_amount)
      : Math.round(calculatedTotal * 100) / 100;

    const quotationDate = data.quotation_date || new Date().toISOString().slice(0, 10);
    
    // Default valid until 30 days ahead if not specified
    let validUntil = data.valid_until || null;
    if (!validUntil) {
      const v = new Date();
      v.setDate(v.getDate() + 30);
      validUntil = v.toISOString().slice(0, 10);
    }

    // 3. Discount Approval Threshold Check (Discount > 35% requires RM approval)
    const { checkDiscountRequiresApproval, getRmEmailForEmployee } = require('./quotationHelper');
    const empIdentifier = data.emp_id || data.EmpId || req.user?.EmpId || req.user?.emp_id || data.prepared_by;
    const rmEmail = await getRmEmailForEmployee(db, empIdentifier);

    let thresholdPercent = 35;
    try {
      const [settingsRows] = await db.query(
        "SELECT setting_value FROM settings WHERE setting_key = 'quotation_approval_threshold' LIMIT 1"
      );
      if (settingsRows && settingsRows.length > 0) {
        thresholdPercent = parseFloat(settingsRows[0].setting_value) || 35;
      }
    } catch (_) {}

    const requiresApproval = checkDiscountRequiresApproval(formattedItems, discountPercent, thresholdPercent);
    const initialStatus = requiresApproval ? 'Pending Approval' : (data.status || 'Sent');

    const defaultTerms = 
      '1. Prices are valid for 30 days from the date of quotation.\n' +
      '2. Goods delivery within 3-5 business days upon order confirmation.\n' +
      '3. GST as applicable at the time of invoicing.\n' +
      '4. Payment terms: 30 days credit from invoice date / advance as agreed.\n' +
      '5. Subject to Delhi jurisdiction.';

    const sql = `
      INSERT INTO Quotations (
        quotation_no, quotation_date, valid_until, client_name, client_email, client_phone,
        client_address, client_gst, subject, items, subtotal, discount_percent, discount_amount,
        tax_type, tax_percent, tax_amount, total_amount, status, terms_conditions, notes,
        prepared_by, emp_id, Tenent_Id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const clientEmail = (data.client_email || '').trim();

    let creatorName = data.prepared_by || req.user?.username || req.user?.Name || req.user?.name || '';
    if ((!creatorName || creatorName === 'Aberdure Sales Team' || creatorName === 'Sales Team') && empIdentifier) {
      try {
        const [empRow] = await db.query('SELECT Name FROM Employees WHERE EmpId = ? LIMIT 1', [empIdentifier]);
        if (empRow && empRow.length > 0 && empRow[0].Name) {
          creatorName = empRow[0].Name;
        }
      } catch (_) {}
    }
    if (!creatorName || creatorName === 'Aberdure Sales Team' || creatorName === 'Sales Team') {
      creatorName = empIdentifier ? String(empIdentifier) : null;
    }

    const [result] = await db.query(sql, [
      quotationNo,
      quotationDate,
      validUntil,
      clientName,
      clientEmail,
      data.client_phone || '',
      data.client_address || '',
      data.client_gst || '',
      data.subject || 'Quotation for Supply of Pharmaceutical Products',
      JSON.stringify(formattedItems),
      subtotal,
      discountPercent,
      discountAmount,
      taxType,
      taxPercent,
      taxAmount,
      totalAmount,
      initialStatus,
      data.terms_conditions || defaultTerms,
      data.notes || '',
      creatorName,
      empIdentifier ? String(empIdentifier) : null,
      tenantId
    ]);

    // Send email to client if within 35% discount limit (CC to RM)
    let emailSent = false;
    if (!requiresApproval && clientEmail) {
      const { sendQuotationEmail } = require('./quotationEmail');
      const emailResult = await sendQuotationEmail({
        quotation_no: quotationNo,
        quotation_date: quotationDate,
        valid_until: validUntil,
        client_name: clientName,
        client_email: clientEmail,
        items: formattedItems,
        subtotal,
        discount_percent: discountPercent,
        discount_amount: discountAmount,
        tax_percent: taxPercent,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        terms_conditions: data.terms_conditions || defaultTerms,
        notes: data.notes || '',
        cc: rmEmail
      });
      emailSent = emailResult.sent;
    }

    response.success = true;
    if (requiresApproval) {
      response.message = 'Quotation sent for RM approval (Item discount exceeds 35%).';
    } else if (emailSent) {
      response.message = `Quotation created and sent to ${clientEmail}${rmEmail ? ` (CC: ${rmEmail})` : ''}.`;
    } else {
      response.message = 'Quotation created successfully.';
    }

    response.data = {
      id: result.insertId,
      quotation_no: quotationNo,
      total_amount: totalAmount,
      status: initialStatus,
      requires_approval: requiresApproval,
      email_sent: emailSent,
      rm_email: rmEmail
    };

    return res.json(response);
  } catch (err) {
    console.error('Error creating quotation:', err);
    response.message = `Database Error: ${err.message}`;
    return res.status(500).json(response);
  }
};

module.exports = createQuotation;
