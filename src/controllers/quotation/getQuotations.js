const db = require('../../config/db');

const getQuotations = async (req, res) => {
  const response = { success: false, message: '', data: [], stats: {} };
  const query = req.query || {};
  const body = req.body || {};

  const tenantId = query.Tenent_Id || query.tenantId || body.Tenent_Id || body.tenantId || 1;
  const empId = (query.empId || query.EmpId || query.emp_id || body.empId || body.EmpId || body.emp_id || '').toString().trim();
  const role = (query.role || query.Role || body.role || body.Role || '').toString().trim();
  const status = (query.status || body.status || '').trim();
  const search = (query.search || body.search || '').trim();

  try {
    const isAdmin = ['Admin', 'admin', 'SuperAdmin'].includes(role);

    let empName = null;
    let isRM = ['RM', 'rm', 'Manager'].includes(role);

    // 1. Fetch employee Name and check if Role is RM
    if (empId) {
      try {
        const [empRows] = await db.query(
          'SELECT Name, Role FROM Employees WHERE EmpId = ? LIMIT 1',
          [empId]
        );
        if (empRows && empRows.length > 0) {
          empName = empRows[0].Name;
          if (['RM', 'rm', 'Manager'].includes(empRows[0].Role)) {
            isRM = true;
          }
        }
      } catch (_) {}
    }

    // 2. Build list of allowed Employee IDs and Names
    const allowedEmpIds = empId ? [empId] : [];
    const allowedNames = empName ? [empName] : [];

    if (!isAdmin && empId) {
      try {
        // Find all subordinates reporting to this RM (by EmpId or Name)
        const subSql = 'SELECT EmpId, Name FROM Employees WHERE RM = ?' + (empName ? ' OR RM = ?' : '');
        const subParams = empName ? [empId, empName] : [empId];
        const [subRows] = await db.query(subSql, subParams);

        if (subRows && subRows.length > 0) {
          isRM = true;
          for (const sub of subRows) {
            if (sub.EmpId && !allowedEmpIds.includes(sub.EmpId)) allowedEmpIds.push(sub.EmpId);
            if (sub.Name && !allowedNames.includes(sub.Name)) allowedNames.push(sub.Name);
          }
        }
      } catch (_) {}
    }

    const conditions = ['(Tenent_Id = ? OR Tenent_Id IS NULL)'];
    const params = [tenantId];

    if (!isAdmin && empId) {
      const empPlaceholders = allowedEmpIds.map(() => '?').join(',');
      const namePlaceholders = allowedNames.length > 0 ? allowedNames.map(() => '?').join(',') : null;

      if (namePlaceholders) {
        conditions.push(`(emp_id IN (${empPlaceholders}) OR prepared_by IN (${namePlaceholders}))`);
        params.push(...allowedEmpIds, ...allowedNames);
      } else {
        conditions.push(`(emp_id IN (${empPlaceholders}))`);
        params.push(...allowedEmpIds);
      }
    } else if (!isAdmin && !empId) {
      // Non-admin without empId should not access all company quotations
      conditions.push('1 = 0');
    }

    // Calculate scoped stats based on user's authorized scope
    const statsSql = `SELECT status, total_amount FROM Quotations WHERE ${conditions.join(' AND ')}`;
    const [allRows] = await db.query(statsSql, params);

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

    // Build query for returned list with status and search filters
    const listConditions = [...conditions];
    const listParams = [...params];

    if (status && status !== 'All') {
      listConditions.push('status = ?');
      listParams.push(status);
    }

    if (search) {
      listConditions.push('(quotation_no LIKE ? OR client_name LIKE ? OR client_phone LIKE ? OR subject LIKE ?)');
      const s = `%${search}%`;
      listParams.push(s, s, s, s);
    }

    const listSql = `SELECT * FROM Quotations WHERE ${listConditions.join(' AND ')} ORDER BY id DESC`;
    const [rows] = await db.query(listSql, listParams);

    // Lookup employee and RM names for creator and approver
    const empIdsToLookup = new Set();
    for (const r of rows) {
      if (r.emp_id) empIdsToLookup.add(r.emp_id);
      if (r.approved_by) empIdsToLookup.add(r.approved_by);
    }

    const empMap = {};
    if (empIdsToLookup.size > 0) {
      try {
        const [empRows] = await db.query(
          'SELECT EmpId, Name, RM FROM Employees WHERE EmpId IN (?)',
          [Array.from(empIdsToLookup)]
        );
        const rmIdsToLookup = new Set();
        for (const emp of empRows) {
          empMap[emp.EmpId] = emp;
          if (emp.RM) rmIdsToLookup.add(emp.RM);
        }
        if (rmIdsToLookup.size > 0) {
          const [rmRows] = await db.query(
            'SELECT EmpId, Name FROM Employees WHERE EmpId IN (?)',
            [Array.from(rmIdsToLookup)]
          );
          for (const rm of rmRows) {
            empMap[rm.EmpId] = rm;
          }
        }
      } catch (e) {
        console.warn('Could not lookup employee names for quotations:', e.message);
      }
    }

    // Parse items JSON and resolve real creator & approver names
    const formatted = rows.map(r => {
      let parsedItems = [];
      try {
        parsedItems = typeof r.items === 'string' ? JSON.parse(r.items) : (r.items || []);
      } catch (_) {}

      // Resolve creator name - ONLY show actual person's name or emp_id
      let creatorName = r.prepared_by;
      if (!creatorName || creatorName === 'Aberdure Sales Team' || creatorName === 'Sales Team' || creatorName === r.emp_id) {
        if (r.emp_id && empMap[r.emp_id]) {
          creatorName = empMap[r.emp_id].Name;
        }
      }
      if (!creatorName || creatorName === 'Aberdure Sales Team' || creatorName === 'Sales Team') {
        creatorName = r.emp_id || null;
      }

      // Resolve approver name - ONLY show actual person who approved (no fake 'Admin' fallback)
      let approverName = r.approved_by;
      if (r.status === 'Approved') {
        if (!approverName || approverName.toLowerCase() === 'approved' || approverName.toLowerCase() === 'admin') {
          // If approved_by wasn't set on old records, check if employee has an assigned RM name
          if (r.emp_id && empMap[r.emp_id] && empMap[r.emp_id].RM) {
            const rmId = empMap[r.emp_id].RM;
            approverName = empMap[rmId] ? empMap[rmId].Name : (empMap[rmId] ? rmId : null);
          } else {
            approverName = null;
          }
        } else if (empMap[approverName]) {
          approverName = empMap[approverName].Name;
        }
      } else {
        approverName = null;
      }

      return {
        ...r,
        State: r.State || r.client_state || '',
        client_state: r.State || r.client_state || '',
        prepared_by: creatorName,
        created_by_name: creatorName,
        approved_by: approverName,
        approved_by_name: approverName,
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
