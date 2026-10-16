const db = require('../../config/db');

// 2. Get Asset (src/assets/get_asset.php)
const getAsset = async (req, res) => {
  const response = { success: false, message: '', data: [] };

  try {
    const [rows] = await db.query('SELECT * FROM assets');

    if (rows && rows.length > 0) {
      response.success = true;
      response.message = 'Assets retrieved successfully.';
      response.data = rows;
    } else {
      response.message = 'No assets found.';
    }

    return res.json(response);
  } catch (err) {
    console.error('Error in getAsset:', err);
    response.message = `Error retrieving assets: ${err.message}`;
    return res.status(500).json(response);
  }
};

module.exports = getAsset;
