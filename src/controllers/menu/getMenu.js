// const { pool } = require('../../config/db');

// const getMenu = async (req, res, next) => {
//   try {
//     const [rows] = await pool.query('SELECT * FROM Menu');
//     if (rows.length > 0) {
//       return res.json({
//         success: true,
//         message: 'Menu retrieved successfully.',
//         data: rows
//       });
//     } else {
//       return res.json({ success: false, message: 'No Menu found.', data: [] });
//     }
//   } catch (err) {
//     return res.json({ success: false, message: 'Error retrieving Menu: ' + err.message, data: [] });
//   }
// };

// // GET /src/menu/get_transaction.php;

// module.exports = getMenu;



const { pool } = require('../../config/db');
 
const getCheckpoints = async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        MIN(Id) AS MenuId,
        SameMenuId,
        'Docket' AS Cat,
        '' AS Sub,
        '' AS Caption,
        GROUP_CONCAT(
          CheckpointId
          ORDER BY CheckpointId
          SEPARATOR ','
        ) AS CheckpointId,
        MAX(Active) AS Active,
        '' AS Icons,
        '' AS Verifier,
        '' AS Approver,
        '' AS Verifier_Role,
        '' AS Approver_Role
      FROM Menu
      WHERE Active = 1
      GROUP BY SameMenuId
    `);
 
    if (rows.length > 0) {
      return res.json({
        success: true,
        message: 'Menu retrieved successfully.',
        data: rows
      });
    }
 
    return res.json({
      success: false,
      message: 'No Menu found.',
      data: []
    });
 
  } catch (err) {
    console.error('Error retrieving Menu:', err);
 
    return res.status(500).json({
      success: false,
      message: 'Error retrieving Menu: ' + err.message,
      data: []
    });
  }
};
 
module.exports = getCheckpoints;