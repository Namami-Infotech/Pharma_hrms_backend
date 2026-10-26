const { sendMail } = require('../../config/mailer');
const { COMPANY_DETAILS } = require('./quotationHelper');

/**
 * Send quotation email to client with rich Aberdure Pharma branding
 */
async function sendQuotationEmail(quotation) {
  if (!quotation || !quotation.client_email) {
    console.warn('[Quotation Email] Skipped: No client email provided.');
    return { sent: false, reason: 'No client email provided' };
  }

  const comp = COMPANY_DETAILS;
  const items = Array.isArray(quotation.items) 
    ? quotation.items 
    : (typeof quotation.items === 'string' ? JSON.parse(quotation.items || '[]') : []);

  const formatDate = (dStr) => {
    if (!dStr) return 'N/A';
    try {
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return dStr;
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (_) {
      return dStr;
    }
  };

  const rowsHtml = items.map((it, idx) => `
    <tr style="border-bottom: 1px solid #e5e7eb; ${idx % 2 === 1 ? 'background-color: #f9fafb;' : ''}">
      <td style="padding: 8px 10px; text-align: center; color: #6b7280; font-size: 12px;">${idx + 1}</td>
      <td style="padding: 8px 10px; font-weight: 600; color: #111827; font-size: 13px;">${it.description || '—'}</td>
      <td style="padding: 8px 10px; text-align: center; color: #4b5563; font-size: 12px;">${it.hsn || '3004'}</td>
      <td style="padding: 8px 10px; color: #4b5563; font-size: 12px;">${it.pack || '—'}</td>
      <td style="padding: 8px 10px; text-align: center; font-weight: 700; color: #111827; font-size: 13px;">${it.qty || 0}</td>
      <td style="padding: 8px 10px; text-align: right; color: #374151; font-size: 13px;">₹${parseFloat(it.rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
      <td style="padding: 8px 10px; text-align: right; font-weight: 700; color: #8d0638; font-size: 13px;">₹${parseFloat(it.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Quotation ${quotation.quotation_no}</title>
    </head>
    <body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f5f7; color: #1f2937;">
      <div style="max-width: 680px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e5e7eb;">
        
        <!-- Header Banner -->
        <div style="background: linear-gradient(135deg, #8d0638 0%, #5d0324 100%); color: #ffffff; padding: 24px 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 1px;">${comp.name}</h1>
          <p style="margin: 4px 0 0; font-size: 12px; opacity: 0.9; letter-spacing: 0.5px;">${comp.tagline}</p>
          <p style="margin: 6px 0 0; font-size: 11px; opacity: 0.8;">GSTIN: ${comp.gstin} | D.L. No: ${comp.dlNo}</p>
        </div>

        <!-- Greeting & Intro -->
        <div style="padding: 24px 30px 10px;">
          <h2 style="margin: 0 0 6px; font-size: 16px; color: #8d0638;">QUOTATION / ESTIMATE</h2>
          <p style="margin: 0 0 16px; font-size: 13px; color: #4b5563;">
            Dear <strong>${quotation.client_name}</strong>,<br>
            Thank you for your inquiry. Please find our commercial quotation detailed below.
          </p>

          <!-- Quotation Info Bar -->
          <table style="width: 100%; border-collapse: collapse; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; margin-bottom: 20px;">
            <tr>
              <td style="padding: 10px 14px; font-size: 12px; width: 50%;">
                <strong style="color: #6b7280;">Quotation No:</strong><br>
                <span style="font-size: 14px; font-weight: 800; color: #8d0638;">${quotation.quotation_no}</span>
              </td>
              <td style="padding: 10px 14px; font-size: 12px; width: 25%;">
                <strong style="color: #6b7280;">Date:</strong><br>
                <span style="font-weight: 600; color: #111827;">${formatDate(quotation.quotation_date)}</span>
              </td>
              <td style="padding: 10px 14px; font-size: 12px; width: 25%;">
                <strong style="color: #6b7280;">Valid Until:</strong><br>
                <span style="font-weight: 600; color: #dc2626;">${formatDate(quotation.valid_until)}</span>
              </td>
            </tr>
          </table>

          <!-- Items Table -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 12px;">
            <thead>
              <tr style="background-color: #f3f4f6; border-top: 1px solid #d1d5db; border-bottom: 2px solid #8d0638;">
                <th style="padding: 10px 8px; text-align: center; color: #374151; font-weight: 700; width: 6%;">#</th>
                <th style="padding: 10px 8px; text-align: left; color: #374151; font-weight: 700;">Product</th>
                <th style="padding: 10px 8px; text-align: center; color: #374151; font-weight: 700; width: 12%;">HSN</th>
                <th style="padding: 10px 8px; text-align: left; color: #374151; font-weight: 700; width: 14%;">Pack</th>
                <th style="padding: 10px 8px; text-align: center; color: #374151; font-weight: 700; width: 10%;">Qty</th>
                <th style="padding: 10px 8px; text-align: right; color: #374151; font-weight: 700; width: 15%;">Rate</th>
                <th style="padding: 10px 8px; text-align: right; color: #374151; font-weight: 700; width: 16%;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <!-- Financial Calculation -->
          <div style="margin-left: auto; width: 260px; margin-bottom: 20px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr>
                <td style="padding: 4px 0; color: #6b7280;">Subtotal:</td>
                <td style="padding: 4px 0; text-align: right; font-weight: 600; color: #111827;">₹${parseFloat(quotation.subtotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
              ${parseFloat(quotation.discount_amount || 0) > 0 ? `
              <tr>
                <td style="padding: 4px 0; color: #ef4444;">Discount (${quotation.discount_percent || 0}%):</td>
                <td style="padding: 4px 0; text-align: right; color: #ef4444; font-weight: 600;">-₹${parseFloat(quotation.discount_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>` : ''}
              <tr>
                <td style="padding: 4px 0; color: #6b7280;">GST (${quotation.tax_percent || 12}%):</td>
                <td style="padding: 4px 0; text-align: right; font-weight: 600; color: #111827;">+₹${parseFloat(quotation.tax_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr style="border-top: 2px solid #8d0638;">
                <td style="padding: 8px 0; font-size: 15px; font-weight: 800; color: #8d0638;">Grand Total:</td>
                <td style="padding: 8px 0; text-align: right; font-size: 16px; font-weight: 800; color: #8d0638;">₹${parseFloat(quotation.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
            </table>
          </div>

          <!-- Terms -->
          ${quotation.terms_conditions ? `
          <div style="background-color: #f9fafb; border-left: 3px solid #8d0638; padding: 10px 14px; margin-bottom: 20px;">
            <strong style="font-size: 11px; text-transform: uppercase; color: #8d0638; display: block; margin-bottom: 4px;">Terms & Conditions</strong>
            <pre style="margin: 0; font-family: inherit; font-size: 11px; color: #4b5563; white-space: pre-wrap; line-height: 1.4;">${quotation.terms_conditions}</pre>
          </div>` : ''}

          <!-- Notes -->
          ${quotation.notes ? `
          <div style="background-color: #fefce8; border: 1px solid #fef08a; padding: 10px 14px; border-radius: 4px; margin-bottom: 20px; font-size: 12px; color: #854d0e;">
            <strong>Note:</strong> ${quotation.notes}
          </div>` : ''}
        </div>

        <!-- Footer -->
        <div style="background-color: #f9fafb; border-top: 1px solid #e5e7eb; padding: 16px 30px; text-align: center; font-size: 11px; color: #6b7280;">
          <p style="margin: 0 0 4px;">For any questions, reach out at <a href="mailto:${comp.email}" style="color: #8d0638; text-decoration: none;">${comp.email}</a> or call ${comp.phone}</p>
          <p style="margin: 0;">${comp.name} • ${comp.address}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await sendMail({
      to: quotation.client_email,
      subject: `Quotation ${quotation.quotation_no} - ${comp.name}`,
      html,
      text: `Quotation ${quotation.quotation_no} for ${quotation.client_name}. Grand Total: ₹${quotation.total_amount}. Valid Until: ${quotation.valid_until}`
    });

    console.log(`[Quotation Email] Sent successfully to ${quotation.client_email}. MessageId: ${info.messageId}`);
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[Quotation Email] Failed sending to ${quotation.client_email}:`, err.message);
    return { sent: false, error: err.message };
  }
}

module.exports = { sendQuotationEmail };
