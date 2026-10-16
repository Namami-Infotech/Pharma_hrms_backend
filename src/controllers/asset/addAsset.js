const db = require('../../config/db');

// 1. Add Asset (src/assets/add_asset.php)
const addAsset = async (req, res) => {
  const response = { success: false, message: '' };
  const data = req.body || {};

  const productName = data.product_name || '';
  const addedDate = data.added_date || '';

  if (!productName) {
    response.message = 'Product Name and Model Name are required.';
    return res.json(response);
  }

  try {
    await db.execute(
      'INSERT INTO assets (product_name, added_date) VALUES (?, ?)',
      [productName, addedDate]
    );

    response.success = true;
    response.message = 'Asset added successfully.';
    return res.json(response);
  } catch (err) {
    console.error('Error in addAsset:', err);
    response.message = `Error adding asset: ${err.message}`;
    return res.status(500).json(response);
  }
};

module.exports = addAsset;
