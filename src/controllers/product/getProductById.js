const pool = require('../../config/db');

/**
 * GET /product/view_product.php?id=123 (or /product/:id)
 */
const getProductById = async (req, res) => {
  try {
    const id = req.params.id || req.query.id || req.body.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);

    if (!rows || rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Error in getProductById:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: error.message
    });
  }
};

module.exports = getProductById;
