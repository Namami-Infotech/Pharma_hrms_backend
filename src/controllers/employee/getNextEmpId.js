const db = require('../../config/db');

const getNextEmpId = async (req, res) => {
  const response = { success: false, nextEmpId: '', message: '' };
  try {
    const requestedPrefix = (req.query.prefix || req.body.prefix || '').toString().trim().toUpperCase();

    // Query all existing EmpIds from Employees across the DB
    const [rows] = await db.query('SELECT EmpId FROM Employees ORDER BY id DESC');
    const existingIds = new Set(
      rows.map(r => (r.EmpId || '').toString().trim().toUpperCase())
    );

    let prefix = requestedPrefix;
    let padLength = 4;

    if (!prefix) {
      // Pick prefix from the latest added employee
      if (rows.length > 0) {
        for (const r of rows) {
          const m = (r.EmpId || '').toString().trim().match(/^([A-Za-z_]+)([0-9]+)$/);
          if (m) {
            prefix = m[1].toUpperCase();
            padLength = Math.max(m[2].length, 4);
            break;
          }
        }
      }
    }

    if (!prefix) {
      prefix = 'AP';
      padLength = 4;
    }

    // Find the max number for this prefix
    let maxNum = 0;
    const regex = new RegExp(`^${prefix}([0-9]+)$`, 'i');
    for (const r of rows) {
      const id = (r.EmpId || '').toString().trim();
      const m = id.match(regex);
      if (m) {
        const val = parseInt(m[1], 10);
        if (!isNaN(val) && val > maxNum) {
          maxNum = val;
          if (m[1].length > padLength) padLength = m[1].length;
        }
      }
    }

    let nextNum = maxNum + 1;
    let candidate = `${prefix}${String(nextNum).padStart(padLength, '0')}`;
    while (existingIds.has(candidate.toUpperCase())) {
      nextNum++;
      candidate = `${prefix}${String(nextNum).padStart(padLength, '0')}`;
    }

    response.success = true;
    response.nextEmpId = candidate;
    response.message = `Generated unique next ID: ${candidate}`;
    return res.json(response);
  } catch (err) {
    console.error('Error generating next EmpId:', err);
    response.message = err.message;
    return res.status(500).json(response);
  }
};

module.exports = getNextEmpId;
