const db = require('../../config/db');

const getQuotations = async (req, res) => {
  const response = { success: false, message: '', data: [], stats: {} };
  const query = req.query || {};
  const tenantId = query.Tenent_Id || query.tenantId || 1;
  const status = (query.status || '').trim();
  const search = (query.search || '').trim();

  try {
    let sql = 'SELECT * FROM Quotations WHERE (Tenent_Id = ? OR Tenent_Id IS NULL)';
    const params = [tenantId];

    if (status && status !== 'All') {
      sql += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      sql += ' AND (quotation_no LIKE ? OR client_name LIKE ? OR client_phone LIKE ? OR subject LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    sql += ' ORDER BY id DESC';

    const [rows] = await db.query(sql, params);

    // Calculate overall stats
    const [allRows] = await db.query(
      'SELECT status, total_amount FROM Quotations WHERE (Tenent_Id = ? OR Tenent_Id IS NULL)',
      [tenantId]
    );

    let totalValue = 0;
    let sentCount = 0;
    let approvedCount = 0;
    let pendingApprovalCount = 0;
    let rejectedCount = 0;
    let draftCount = 0;

    for (const r of allRows) {
      const amt = parseFloat(r.total_amount) || 0;
      totalValue += amt;
      const st = (r.status || '').toLowerCase();
      if (st === 'sent') sentCount++;
      else if (st === 'approved') approvedCount++;
      else if (st === 'pending approval' || st === 'pending') pendingApprovalCount++;
      else if (st === 'rejected') rejectedCount++;
      else if (st === 'draft') draftCount++;
    }

    // Parse items JSON for each row
    const formatted = rows.map(r => {
      let parsedItems = [];
      try {
        parsedItems = typeof r.items === 'string' ? JSON.parse(r.items) : (r.items || []);
      } catch (_) {}
      return {
        ...r,
        items: parsedItems
      };
    });

    response.success = true;
    response.data = formatted;
    response.stats = {
      totalQuotations: allRows.length,
      totalValue: Math.round(totalValue * 100) / 100,
      sentCount,
      approvedCount,
      pendingApprovalCount,
      rejectedCount,
      draftCount
    };

    return res.json(response);
  } catch (err) {
    console.error('Error fetching quotations:', err);
    response.message = `Database Error: ${err.message}`;
    return res.status(500).json(response);
  }
};

module.exports = getQuotations;
