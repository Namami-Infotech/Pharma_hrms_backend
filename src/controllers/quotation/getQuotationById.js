const db = require('../../config/db');
const { COMPANY_DETAILS, numberToWords } = require('./quotationHelper');

const getQuotationById = async (req, res) => {
  const response = { success: false, message: '', data: null };
  const id = req.params.id || req.query.id || req.body.id;

  if (!id) {
    response.message = 'Quotation ID is required.';
    return res.status(400).json(response);
  }

  try {
    let sql = 'SELECT * FROM Quotations WHERE id = ? OR quotation_no = ? LIMIT 1';
    const [rows] = await db.query(sql, [id, id]);

    if (!rows || rows.length === 0) {
      response.message = 'Quotation not found.';
      return res.status(404).json(response);
    }

    const q = rows[0];

    let items = [];
    try {
      items = typeof q.items === 'string' ? JSON.parse(q.items) : (q.items || []);
    } catch (_) {}

    const totalAmt = parseFloat(q.total_amount) || 0;
    const subtotal = parseFloat(q.subtotal) || 0;
    const discountAmt = parseFloat(q.discount_amount) || 0;
    const taxAmt = parseFloat(q.tax_amount) || 0;
    const taxPercent = parseFloat(q.tax_percent) || 0;

    // Check tax distribution (CGST + SGST vs IGST)
    const isInterState = q.tax_type === 'IGST';
    const cgstPercent = isInterState ? 0 : taxPercent / 2;
    const sgstPercent = isInterState ? 0 : taxPercent / 2;
    const cgstAmount = isInterState ? 0 : Math.round((taxAmt / 2) * 100) / 100;
    const sgstAmount = isInterState ? 0 : Math.round((taxAmt / 2) * 100) / 100;
    const igstPercent = isInterState ? taxPercent : 0;
    const igstAmount = isInterState ? taxAmt : 0;

    const data = {
      ...q,
      company: COMPANY_DETAILS,
      items,
      subtotal,
      discountAmt,
      taxAmt,
      totalAmt,
      cgstPercent,
      sgstPercent,
      cgstAmount,
      sgstAmount,
      igstPercent,
      igstAmount,
      totalInWords: numberToWords(totalAmt)
    };

    response.success = true;
    response.data = data;
    return res.json(response);
  } catch (err) {
    console.error('Error in getQuotationById:', err);
    response.message = `Database Error: ${err.message}`;
    return res.status(500).json(response);
  }
};

module.exports = getQuotationById;
