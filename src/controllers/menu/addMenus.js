const { pool } = require('../../config/db');

const addMenus = async (req, res, next) => {
  try {
    const input = req.body || {};
    const cat = input.Cat !== undefined ? input.Cat : null;
    const sub = input.Sub !== undefined ? input.Sub : null;
    const caption = input.Caption !== undefined ? input.Caption : null;
    const checkpointId = input.CheckpointId !== undefined ? input.CheckpointId : null;
    const active = input.Active !== undefined ? parseInt(input.Active, 10) : 0;
    const icons = input.Icons !== undefined ? input.Icons : null;
    const verifier = input.Verifier !== undefined ? input.Verifier : null;
    const approver = input.Approver !== undefined ? input.Approver : null;
    const verifierRole = input.Verifier_Role !== undefined ? input.Verifier_Role : null;
    const approverRole = input.Approver_Role !== undefined ? input.Approver_Role : null;
    const sameMenuId = input.SameMenuId !== undefined ? input.SameMenuId : null;

    let menuId;
    if (sameMenuId) {
      menuId = sameMenuId;
    } else {
      const [maxRows] = await pool.query(
        'SELECT COALESCE(MAX(SameMenuId), 0) + 1 AS NewMenuId FROM Menu'
      );
      menuId = maxRows[0]?.NewMenuId || 1;
    }

    const query = `
      INSERT INTO Menu (SameMenuId, Cat, Sub, Caption, CheckpointId, Active, Icons, Verifier, Approver, Verifier_Role, Approver_Role) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await pool.query(query, [
      menuId,
      cat,
      sub,
      caption,
      checkpointId,
      active,
      icons,
      verifier,
      approver,
      verifierRole,
      approverRole
    ]);

    return res.json({
      success: true,
      message: 'Menu added successfully.',
      data: { SameMenuId: menuId }
    });
  } catch (err) {
    return res.json({ success: false, message: 'Error adding menu: ' + err.message, data: [] });
  }
};

// POST /src/menu/add_transaction.php;

module.exports = addMenus;
