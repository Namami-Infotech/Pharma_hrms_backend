const pool = require('../../config/db');

/**
 * POST /product/update_product.php (or /product/update, /product/:id)
 * Body:
 *  - id: number (required)
 *  - name, unit, packaging, price, product_code, hsn, category, composition, description, status
 */
const updateProduct = async (req, res) => {
  try {
    const id = req.body.id || req.params.id || req.query.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required for update'
      });
    }

    const [existing] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const current = existing[0];
    const {
      name,
      unit,
      packaging,
      price,
      product_code,
      hsn,
      category,
      composition,
      description,
      status
    } = req.body || {};

    const updatedName = name !== undefined ? name.trim() : current.name;
    const updatedUnit = unit !== undefined ? unit.trim() : current.unit;
    const updatedPackaging = packaging !== undefined ? packaging.trim() : current.packaging;
    const updatedPrice = price !== undefined ? Math.round(parseFloat(price) * 100) / 100 : current.price;
    const updatedCode = product_code !== undefined ? product_code.trim() : current.product_code;
    const updatedHsn = hsn !== undefined ? hsn.trim() : current.hsn;
    const updatedCategory = category !== undefined ? category.trim() : current.category;
    const updatedComp = composition !== undefined ? composition.trim() : current.composition;
    const updatedDesc = description !== undefined ? description.trim() : current.description;
    const updatedStatus = status !== undefined ? status : current.status;

    if (!updatedName) {
      return res.status(400).json({ success: false, message: 'Product Name cannot be empty' });
    }
    if (!updatedUnit) {
      return res.status(400).json({ success: false, message: 'Product Unit cannot be empty' });
    }
    if (!updatedPackaging) {
      return res.status(400).json({ success: false, message: 'Packaging cannot be empty' });
    }
    if (isNaN(updatedPrice) || updatedPrice < 0) {
      return res.status(400).json({ success: false, message: 'Price must be a valid non-negative number' });
    }

    // Check code collision if code changed
    if (updatedCode !== current.product_code) {
      const [dup] = await pool.query(
        'SELECT id FROM products WHERE product_code = ? AND id != ?',
        [updatedCode, id]
      );
      if (dup.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Product Code "${updatedCode}" is already in use by another product`
        });
      }
    }

    await pool.query(
      `UPDATE products SET 
        product_code = ?,
        name = ?,
        unit = ?,
        packaging = ?,
        price = ?,
        hsn = ?,
        category = ?,
        composition = ?,
        description = ?,
        status = ?
       WHERE id = ?`,
      [
        updatedCode,
        updatedName,
        updatedUnit,
        updatedPackaging,
        updatedPrice,
        updatedHsn,
        updatedCategory,
        updatedComp,
        updatedDesc,
        updatedStatus,
        id
      ]
    );

    const [updatedRows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: updatedRows[0]
    });
  } catch (error) {
    console.error('Error in updateProduct:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: error.message
    });
  }
};

module.exports = updateProduct;
