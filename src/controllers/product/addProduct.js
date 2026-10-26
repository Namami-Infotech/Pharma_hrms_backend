const pool = require('../../config/db');

/**
 * POST /product/add_product.php (or /product/add, /product/create)
 * Body:
 *  - name: string (required)
 *  - unit: string (required, e.g. Strip, Box, Bottle, Vial, Tube, Tablet, etc.)
 *  - packaging: string (required, e.g. 10x10 Tablets, 100ml Bottle)
 *  - price: number (required)
 *  - product_code: string (optional, auto-generated if blank)
 *  - hsn: string (optional, default '3004')
 *  - category: string (optional, default 'General')
 *  - composition: string (optional)
 *  - description: string (optional)
 *  - status: string (optional, default 'Active')
 *  - Tenent_Id: number (optional, default 1)
 */
const addProduct = async (req, res) => {
  try {
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
      status,
      Tenent_Id
    } = req.body || {};

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Product Name is required'
      });
    }

    if (!unit || !unit.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Product Unit (e.g. Strip, Box, Bottle) is required'
      });
    }

    if (!packaging || !packaging.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Packaging (e.g. 10x10 Tablets, 100ml Bottle) is required'
      });
    }

    if (price === undefined || price === null || isNaN(parseFloat(price)) || parseFloat(price) < 0) {
      return res.status(400).json({
        success: false,
        message: 'A valid non-negative Price is required'
      });
    }

    const tenantId = Tenent_Id || 1;
    const finalPrice = Math.round(parseFloat(price) * 100) / 100;
    const finalStatus = status === 'Inactive' ? 'Inactive' : 'Active';
    const finalHsn = (hsn && hsn.trim()) ? hsn.trim() : '3004';
    const finalCategory = (category && category.trim()) ? category.trim() : 'General';

    // Auto-generate product code if not provided
    let finalCode = (product_code && product_code.trim()) ? product_code.trim() : null;
    if (!finalCode) {
      const [lastRow] = await pool.query(
        'SELECT id FROM products ORDER BY id DESC LIMIT 1'
      );
      const nextNum = (lastRow && lastRow[0]?.id ? lastRow[0].id + 1 : 1);
      finalCode = `AP-PRD-${String(nextNum).padStart(4, '0')}`;
    } else {
      // Check code uniqueness
      const [dup] = await pool.query(
        'SELECT id FROM products WHERE product_code = ?',
        [finalCode]
      );
      if (dup.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Product Code "${finalCode}" already exists. Please choose a unique code.`
        });
      }
    }

    const [result] = await pool.query(
      `INSERT INTO products (
        product_code, name, unit, packaging, price, hsn, category, 
        composition, description, status, Tenent_Id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        finalCode,
        name.trim(),
        unit.trim(),
        packaging.trim(),
        finalPrice,
        finalHsn,
        finalCategory,
        composition ? composition.trim() : '',
        description ? description.trim() : '',
        finalStatus,
        tenantId
      ]
    );

    const [createdRows] = await pool.query('SELECT * FROM products WHERE id = ?', [result.insertId]);

    return res.status(201).json({
      success: true,
      message: 'Product added successfully',
      data: createdRows[0]
    });
  } catch (error) {
    console.error('Error in addProduct:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add product',
      error: error.message
    });
  }
};

module.exports = addProduct;
