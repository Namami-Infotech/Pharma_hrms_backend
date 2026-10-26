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
    // 1. Auto-generate quotation number if not provided
    let quotationNo = (data.quotation_no || '').trim();
    if (!quotationNo) {
      const [latest] = await db.query(
        'SELECT quotation_no FROM Quotations WHERE quotation_no LIKE ? ORDER BY id DESC LIMIT 1',
        [`AP/QT/${currentYear}/%`]
      );

      let nextNum = 1;
      if (latest && latest.length > 0) {
        const m = latest[0].quotation_no.match(/([0-9]+)$/);
        if (m) {
          nextNum = parseInt(m[1], 10) + 1;
        }
      }
      quotationNo = `AP/QT/${currentYear}/${String(nextNum).padStart(4, '0')}`;
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
    const discountPercent = parseFloat(data.discount_percent) || 0;
    const discountAmount = data.discount_amount !== undefined 
      ? parseFloat(data.discount_amount) 
      : Math.round(((subtotal * discountPercent) / 100) * 100) / 100;

    const afterDiscount = Math.max(0, subtotal - discountAmount);
    const taxType = (data.tax_type || 'GST').toUpperCase();
    const taxPercent = data.tax_percent !== undefined ? parseFloat(data.tax_percent) : 12.00;
    const taxAmount = data.tax_amount !== undefined
      ? parseFloat(data.tax_amount)
      : Math.round(((afterDiscount * taxPercent) / 100) * 100) / 100;

    const totalAmount = data.total_amount !== undefined
      ? parseFloat(data.total_amount)
      : Math.round((afterDiscount + taxAmount) * 100) / 100;

    const quotationDate = data.quotation_date || new Date().toISOString().slice(0, 10);
    
    // Default valid until 30 days ahead if not specified
    let validUntil = data.valid_until || null;
    if (!validUntil) {
      const v = new Date();
      v.setDate(v.getDate() + 30);
      validUntil = v.toISOString().slice(0, 10);
    }

    // 3. Dynamic Approval Threshold Check
    let approvalThreshold = 35000;
    try {
      const [settingRows] = await db.query(
        "SELECT setting_value FROM settings WHERE setting_key = 'quotation_approval_threshold' LIMIT 1"
      );
      if (settingRows && settingRows.length > 0 && !isNaN(parseFloat(settingRows[0].setting_value))) {
        approvalThreshold = parseFloat(settingRows[0].setting_value);
      }
    } catch (settErr) {
      console.warn('Error reading approval threshold from settings:', settErr.message);
    }

    const requiresApproval = totalAmount > approvalThreshold;
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
        prepared_by, Tenent_Id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const clientEmail = (data.client_email || '').trim();

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
      data.prepared_by || 'Aberdure Sales Team',
      tenantId
    ]);

    // Send email to client if within threshold limit
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
        notes: data.notes || ''
      });
      emailSent = emailResult.sent;
    }

    response.success = true;
    if (requiresApproval) {
      response.message = `Quotation created and sent for approval (Amount ₹${totalAmount.toLocaleString('en-IN')} exceeds limit ₹${approvalThreshold.toLocaleString('en-IN')}).`;
    } else if (emailSent) {
      response.message = `Quotation created and sent to client email (${clientEmail}).`;
    } else {
      response.message = 'Quotation created successfully.';
    }

    response.data = {
      id: result.insertId,
      quotation_no: quotationNo,
      total_amount: totalAmount,
      status: initialStatus,
      requires_approval: requiresApproval,
      email_sent: emailSent
    };

    return res.json(response);
  } catch (err) {
    console.error('Error creating quotation:', err);
    response.message = `Database Error: ${err.message}`;
    return res.status(500).json(response);
  }
};

module.exports = createQuotation;
