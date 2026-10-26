const db = require('../../config/db');

const getDealerFields = async (req, res) => {
  const response = { success: false, message: '', data: [] };

  try {
    // 1. Try to fetch checkpoints mapped to Dealer Menu (SameMenuId = 1)
    let [rows] = await db.query(
      `SELECT c.Id, c.Description, c.Value, c.Options, c.TypeId, t.Description AS TypeName, 
              c.Mandatory, c.Editable, c.Size, c.Validation, c.Active
       FROM Menu m 
       JOIN Checkpoints c ON m.CheckpointId = c.Id 
       LEFT JOIN Type t ON c.TypeId = t.Id 
       WHERE m.SameMenuId = 1 AND c.Active = 1
       ORDER BY m.Id ASC`
    );

    // 2. If no menu links found, fetch all active checkpoints
    if (!rows || rows.length === 0) {
      [rows] = await db.query(
        `SELECT c.Id, c.Description, c.Value, c.Options, c.TypeId, t.Description AS TypeName, 
                c.Mandatory, c.Editable, c.Size, c.Validation, c.Active
         FROM Checkpoints c 
         LEFT JOIN Type t ON c.TypeId = t.Id 
         WHERE c.Active = 1
         ORDER BY c.Id ASC`
      );
    }

    response.success = true;
    response.message = 'Dealer dynamic fields retrieved successfully.';
    response.data = rows || [];
    return res.json(response);
  } catch (err) {
    console.error('Error in getDealerFields:', err);
    response.message = 'An error occurred: ' + err.message;
    return res.status(500).json(response);
  }
};

module.exports = getDealerFields;
