const db = require('../../config/db');

const updateLeaveBalance = async (req, res) => {
  const response = { success: false, message: '' };
  const data = req.body || {};
  const empid = data.empid || data.EmpId || '';

  if (!empid) {
    response.message = 'Please provide employee ID (empid).';
    return res.status(400).json(response);
  }

  try {
    const sl = parseFloat(data.SL ?? data.sl ?? 0);
    const el = parseFloat(data.EL ?? data.el ?? 0);
    const cl = parseFloat(data.CL ?? data.cl ?? 0);
    const pl = parseFloat(data.PL ?? data.pl ?? 0);
    const bl = parseFloat(data.BL ?? data.bl ?? 0);
    const compOff = parseFloat(data.CompOff ?? data.compoff ?? 0);
    const tenantId = data.Tenent_Id || data.tenent_id || 1;

    const [existing] = await db.query(
      'SELECT id FROM EmployeeLeave WHERE EmpId = ? LIMIT 1',
      [empid]
    );

    if (existing && existing.length > 0) {
      await db.execute(
        'UPDATE EmployeeLeave SET SL = ?, EL = ?, CL = ?, PL = ?, BL = ?, CompOff = ? WHERE EmpId = ?',
        [sl, el, cl, pl, bl, compOff, empid]
      );
    } else {
      await db.execute(
        'INSERT INTO EmployeeLeave (EmpId, SL, EL, CL, PL, BL, CompOff, Tenent_Id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [empid, sl, el, cl, pl, bl, compOff, tenantId]
      );
    }

    response.success = true;
    response.message = 'Employee leave balance updated successfully.';
    return res.json(response);
  } catch (err) {
    console.error('Error in updateLeaveBalance:', err);
    response.message = `An error occurred: ${err.message}`;
    return res.status(500).json(response);
  }
};

module.exports = updateLeaveBalance;
