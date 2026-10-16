const { pool } = require('../../config/db');

const addCheckpoints = async (req, res, next) => {
  try {
    const input = req.body || {};

    if (
      input.Description !== undefined &&
      input.TypeId !== undefined &&
      input.Mandatory !== undefined &&
      input.Active !== undefined &&
      String(input.Description).trim() !== '' &&
      String(input.TypeId).trim() !== ''
    ) {
      const size = input.Size !== undefined ? input.Size : '';

      const query = `
        INSERT INTO Checkpoints (Description, Value, Options, TypeId, Mandatory, Editable, Correct, Size, Score, Validation, Language, Active, Dependent, Logic) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await pool.query(query, [
        input.Description || null,
        input.Value || null,
        input.Options || null,
        parseInt(input.TypeId, 10),
        Boolean(input.Mandatory),
        Boolean(input.Editable),
        input.Correct || null,
        size,
        input.Score ? parseInt(input.Score, 10) : null,
        input.Validation || null,
        input.Language ? parseInt(input.Language, 10) : null,
        Boolean(input.Active),
        Boolean(input.Dependent),
        input.Logic || null
      ]);

      return res.json({
        success: true,
        message: 'Checkpoint added successfully.',
        data: []
      });
    } else {
      return res.json({ success: false, message: 'Invalid input data.', data: [] });
    }
  } catch (err) {
    return res.json({ success: false, message: 'Error adding checkpoint: ' + err.message, data: [] });
  }
};

// POST /src/menu/add_menus.php;

module.exports = addCheckpoints;
