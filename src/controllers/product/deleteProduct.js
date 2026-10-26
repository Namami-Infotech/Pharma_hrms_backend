const pool = require('../../config/db');

/**
 * POST /product/delete_product.php (or /product/:id)
 * Body / Query:
 *  - id: number (required)
 */
const deleteProduct = async (req, res) => {
  try {
    const id = req.body.id || req.params.id || req.query.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required for deletion'
      });
    }

    const [existing] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Soft delete: Update status to 'Inactive' instead of deleting the row
    await pool.query("UPDATE products SET status = 'Inactive' WHERE id = ?", [id]);

    return res.status(200).json({
      success: true,
      message: `Product "${existing[0].name}" marked as Inactive successfully`
    });
  } catch (error) {
    console.error('Error in deleteProduct:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: error.message
    });
  }
};

module.exports = deleteProduct;
